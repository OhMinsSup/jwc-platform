import { setTimeout as delay } from "node:timers/promises";

import { z } from "zod";

import { appendTableRowsRequest } from "./cell-data";
import type { CellValue, ReadCell, TableTarget } from "./cell-data";
import type { TokenProvider } from "./service-account";
import {
	SHEETS_FIELDS,
	SheetsResponseSchema,
	toSheetInfos,
} from "./sheet-info";
import type { SheetInfo } from "./sheet-info";

/**
 * Google Sheets v4 REST 최소 클라이언트.
 * 값은 항상 RAW로 쓴다 → 글자는 코덱이 만든 글자 그대로(자동 날짜 변환 방지), 숫자는 숫자(날짜 일련번호 포함).
 * 읽기는 서식 없는 원래 값(UNFORMATTED_VALUE, 날짜는 일련번호)이다 → 운영자가 표시 서식을 바꿔도 해석이 같다.
 */

const API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";
/** 응답 본문이 계약과 다를 때: 일시 장애와 같이 재시도 가능으로 본다 */
const INVALID_RESPONSE_STATUS = 500;
const TOO_MANY_REQUESTS = 429;
const SERVER_ERROR = 500;

export class SheetsApiError extends Error {
	override name = "SheetsApiError";
	readonly status: number;
	constructor(status: number, message: string) {
		super(message);
		this.status = status;
	}
	/** 재시도 가치가 있는 오류인지 (할당량/일시 장애) */
	get retryable(): boolean {
		return this.status === TOO_MANY_REQUESTS || this.status >= SERVER_ERROR;
	}
}

export interface SheetsClient {
	addSheet: (title: string) => Promise<number>;
	/** 시트 "표"의 본문 끝(첫 빈 행)에 행을 더한다. 표 범위가 함께 늘어난다 */
	appendTableRows: (target: TableTarget, rows: CellValue[][]) => Promise<void>;
	appendValues: (range: string, rows: CellValue[][]) => Promise<void>;
	batchUpdate: (requests: unknown[]) => Promise<void>;
	getValues: (range: string) => Promise<ReadCell[][]>;
	listSheets: () => Promise<SheetInfo[]>;
	updateValues: (range: string, rows: CellValue[][]) => Promise<void>;
}

/** 시트 이름은 작은따옴표로 감싸고 내부 따옴표는 두 번 쓴다 (A1 표기 규칙) */
export function quoteSheetName(name: string): string {
	return `'${name.replaceAll("'", "''")}'`;
}

/** 1 → A, 27 → AA */
export function columnLetter(index1: number): string {
	let n = index1;
	let letters = "";
	while (n > 0) {
		const rem = (n - 1) % 26;
		letters = String.fromCodePoint(65 + rem) + letters;
		n = Math.floor((n - 1) / 26);
	}
	return letters;
}

/**
 * 요청 안에서의 짧은 재시도 정책 (제출 요청이 시트에 바로 쓰므로 일시적인 429/5xx를 흡수한다).
 * 오래 기다리지 않는다: 사용자가 응답을 기다리는 중이다.
 */
export interface RetryPolicy {
	/** 첫 시도 포함 최대 시도 횟수 */
	maxAttempts: number;
	/** n번째 실패 뒤 기다릴 시간 (n은 1부터) */
	delayMs: (failedAttempt: number) => number;
	sleep: (ms: number) => Promise<void>;
}

const RETRY_BASE_MS = 300;
const RETRY_FACTOR = 3;

export const DEFAULT_RETRY: RetryPolicy = {
	maxAttempts: 3,
	delayMs: (failedAttempt) =>
		RETRY_BASE_MS * RETRY_FACTOR ** (failedAttempt - 1),
	sleep: async (ms) => {
		await delay(ms);
	},
};

/**
 * 어떤 실패를 다시 보낼지.
 * - transient: 429와 5xx (읽기, 같은 범위 덮어쓰기처럼 두 번 실행돼도 결과가 같은 요청)
 * - rateLimitOnly: 429만 (행 추가처럼 두 번 실행되면 중복이 생기는 요청. 5xx는 이미 반영됐을 수 있다)
 */
type RetryOn = "transient" | "rateLimitOnly";

/** 이 클라이언트가 보내는 요청 형태 (헤더는 request가 정한다) */
interface JsonRequestInit {
	body?: string;
	method?: "POST" | "PUT";
	retryOn?: RetryOn;
}

function shouldRetry(error: unknown, retryOn: RetryOn): boolean {
	if (!(error instanceof SheetsApiError)) {
		return false;
	}
	return retryOn === "transient"
		? error.retryable
		: error.status === TOO_MANY_REQUESTS;
}

type SheetsRequest = <T>(
	path: string,
	schema: z.ZodType<T>,
	init?: JsonRequestInit,
) => Promise<T>;

const AddSheetResponseSchema = z.object({
	replies: z.array(
		z.object({
			addSheet: z.object({ properties: z.object({ sheetId: z.number() }) }),
		}),
	),
});

/** UNFORMATTED_VALUE: 글자, 숫자(날짜는 일련번호), 체크박스는 불리언 */
const ValuesResponseSchema = z.object({
	values: z
		.array(z.array(z.union([z.string(), z.number(), z.boolean()])))
		.optional(),
});

/** 쓰기 응답 본문은 쓰지 않는다 */
const IgnoredResponseSchema = z.unknown();

function valuesPath(range: string): string {
	return `/values/${encodeURIComponent(range)}`;
}

function createRequest(
	spreadsheetId: string,
	getToken: TokenProvider,
	fetchImpl: typeof fetch,
	retry: RetryPolicy,
): SheetsRequest {
	const base = `${API_BASE}/${encodeURIComponent(spreadsheetId)}`;
	const once: SheetsRequest = async (path, schema, init = {}) => {
		const token = await getToken();
		const response = await fetchImpl(`${base}${path}`, {
			method: init.method,
			body: init.body,
			headers: {
				authorization: `Bearer ${token}`,
				"content-type": "application/json",
			},
		});
		if (!response.ok) {
			const detail = await response.text().catch(() => "");
			throw new SheetsApiError(
				response.status,
				`Sheets API ${response.status}: ${detail.slice(0, 300)}`,
			);
		}
		const parsed = schema.safeParse(await response.json());
		if (!parsed.success) {
			throw new SheetsApiError(
				INVALID_RESPONSE_STATUS,
				`Sheets API 응답 형식이 올바르지 않습니다 (${path})`,
			);
		}
		return parsed.data;
	};
	return async (path, schema, init = {}) => {
		const retryOn = init.retryOn ?? "transient";
		for (let attempt = 1; ; attempt += 1) {
			try {
				// oxlint-disable-next-line no-await-in-loop -- 재시도는 앞 시도의 실패를 본 뒤에만 의미가 있다
				return await once(path, schema, init);
			} catch (error) {
				if (attempt >= retry.maxAttempts || !shouldRetry(error, retryOn)) {
					throw error;
				}
				// oxlint-disable-next-line no-await-in-loop -- 위와 같은 이유로 순차 대기
				await retry.sleep(retry.delayMs(attempt));
			}
		}
	};
}

async function listSheets(request: SheetsRequest): Promise<SheetInfo[]> {
	const body = await request(
		`?fields=${encodeURIComponent(SHEETS_FIELDS)}`,
		SheetsResponseSchema,
	);
	return toSheetInfos(body);
}

async function addSheet(request: SheetsRequest, title: string) {
	const body = await request(":batchUpdate", AddSheetResponseSchema, {
		method: "POST",
		body: JSON.stringify({
			requests: [{ addSheet: { properties: { title } } }],
		}),
		// 이미 만들어졌으면 같은 이름으로 다시 만들 수 없다 (5xx 재시도 금지)
		retryOn: "rateLimitOnly",
	});
	const sheetId = body.replies[0]?.addSheet.properties.sheetId;
	if (sheetId === undefined) {
		throw new SheetsApiError(
			INVALID_RESPONSE_STATUS,
			"시트 생성 응답에 sheetId가 없습니다",
		);
	}
	return sheetId;
}

async function getValues(request: SheetsRequest, range: string) {
	const body = await request(
		`${valuesPath(range)}?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=SERIAL_NUMBER`,
		ValuesResponseSchema,
	);
	return body.values ?? [];
}

async function send(
	request: SheetsRequest,
	path: string,
	init: JsonRequestInit,
): Promise<void> {
	await request(path, IgnoredResponseSchema, init);
}

export function createSheetsClient(
	spreadsheetId: string,
	getToken: TokenProvider,
	fetchImpl: typeof fetch = fetch,
	retry: RetryPolicy = DEFAULT_RETRY,
): SheetsClient {
	const request = createRequest(spreadsheetId, getToken, fetchImpl, retry);
	return {
		listSheets: () => listSheets(request),
		addSheet: (title) => addSheet(request, title),
		getValues: (range) => getValues(request, range),
		updateValues: (range, rows) =>
			send(request, `${valuesPath(range)}?valueInputOption=RAW`, {
				method: "PUT",
				body: JSON.stringify({ values: rows }),
			}),
		appendTableRows: (target, rows) =>
			send(request, ":batchUpdate", {
				method: "POST",
				body: JSON.stringify({
					requests: [appendTableRowsRequest(target, rows)],
				}),
				// 이미 반영됐으면 다시 보낼 때 중복 행이 생긴다 (5xx 재시도 금지)
				retryOn: "rateLimitOnly",
			}),
		appendValues: (range, rows) =>
			send(
				request,
				`${valuesPath(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
				{
					method: "POST",
					body: JSON.stringify({ values: rows }),
					retryOn: "rateLimitOnly",
				},
			),
		batchUpdate: (requests) =>
			send(request, ":batchUpdate", {
				method: "POST",
				body: JSON.stringify({ requests }),
			}),
	};
}
