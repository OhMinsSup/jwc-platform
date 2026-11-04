import { z } from "zod";

import type { TokenProvider } from "./service-account";

/**
 * Google Sheets v4 REST 최소 클라이언트.
 * 값은 항상 RAW로 쓴다 → 시트에 보이는 텍스트 = 코덱이 만든 텍스트 (자동 날짜 변환 방지).
 */

const API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";
/** 응답 본문이 계약과 다를 때: 일시 장애와 같이 재시도 가능으로 본다 */
const INVALID_RESPONSE_STATUS = 500;

export class SheetsApiError extends Error {
	override name = "SheetsApiError";
	readonly status: number;
	constructor(status: number, message: string) {
		super(message);
		this.status = status;
	}
	/** 재시도 가치가 있는 오류인지 (할당량/일시 장애) */
	get retryable(): boolean {
		return this.status === 429 || this.status >= 500;
	}
}

export type CellValue = string | null;

export interface SheetsClient {
	addSheet: (title: string) => Promise<number>;
	appendValues: (range: string, rows: CellValue[][]) => Promise<void>;
	batchUpdate: (requests: unknown[]) => Promise<void>;
	getValues: (range: string) => Promise<string[][]>;
	listSheetTitles: () => Promise<{ title: string; sheetId: number }[]>;
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

/** 이 클라이언트가 보내는 요청 형태 (헤더는 request가 정한다) */
interface JsonRequestInit {
	body?: string;
	method?: "POST" | "PUT";
}

type SheetsRequest = <T>(
	path: string,
	schema: z.ZodType<T>,
	init?: JsonRequestInit,
) => Promise<T>;

const SheetTitlesResponseSchema = z.object({
	sheets: z
		.array(
			z.object({
				properties: z.object({ title: z.string(), sheetId: z.number() }),
			}),
		)
		.optional(),
});

const AddSheetResponseSchema = z.object({
	replies: z.array(
		z.object({
			addSheet: z.object({ properties: z.object({ sheetId: z.number() }) }),
		}),
	),
});

/** FORMATTED_VALUE로 읽으므로 셀은 항상 문자열이다 */
const ValuesResponseSchema = z.object({
	values: z.array(z.array(z.string())).optional(),
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
): SheetsRequest {
	const base = `${API_BASE}/${encodeURIComponent(spreadsheetId)}`;
	return async (path, schema, init = {}) => {
		const token = await getToken();
		const response = await fetchImpl(`${base}${path}`, {
			...init,
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
}

async function listSheetTitles(request: SheetsRequest) {
	const body = await request(
		"?fields=sheets.properties(title,sheetId)",
		SheetTitlesResponseSchema,
	);
	return (body.sheets ?? []).map((sheet) => sheet.properties);
}

async function addSheet(request: SheetsRequest, title: string) {
	const body = await request(":batchUpdate", AddSheetResponseSchema, {
		method: "POST",
		body: JSON.stringify({
			requests: [{ addSheet: { properties: { title } } }],
		}),
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
		`${valuesPath(range)}?valueRenderOption=FORMATTED_VALUE`,
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
): SheetsClient {
	const request = createRequest(spreadsheetId, getToken, fetchImpl);
	return {
		listSheetTitles: () => listSheetTitles(request),
		addSheet: (title) => addSheet(request, title),
		getValues: (range) => getValues(request, range),
		updateValues: (range, rows) =>
			send(request, `${valuesPath(range)}?valueInputOption=RAW`, {
				method: "PUT",
				body: JSON.stringify({ values: rows }),
			}),
		appendValues: (range, rows) =>
			send(
				request,
				`${valuesPath(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
				{ method: "POST", body: JSON.stringify({ values: rows }) },
			),
		batchUpdate: (requests) =>
			send(request, ":batchUpdate", {
				method: "POST",
				body: JSON.stringify({ requests }),
			}),
	};
}
