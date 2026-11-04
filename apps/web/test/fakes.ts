import { SheetsApiError } from "../src/server/google/sheets-client";
import type {
	CellValue,
	SheetsClient,
} from "../src/server/google/sheets-client";

/** fetch 입력(문자열/URL/Request)의 주소 */
function requestUrl(input: RequestInfo | URL): string {
	if (typeof input === "string") {
		return input;
	}
	return input instanceof URL ? input.href : input.url;
}

/** fetch 계약 테스트용: 호출을 기록하고 준비된 응답을 순서대로 돌려준다 */
export function recordingFetch(responses: Response[]) {
	const calls: { url: string; init: RequestInit }[] = [];
	const impl = ((input: RequestInfo | URL, init: RequestInit = {}) => {
		calls.push({ url: requestUrl(input), init });
		const next = responses.shift();
		if (!next) {
			return Promise.reject(new Error("예상하지 못한 fetch 호출"));
		}
		return Promise.resolve(next);
	}) as typeof fetch;
	return { impl, calls };
}

/** 기록된 호출의 JSON 본문. 본문이 문자열이 아니면 테스트를 실패시킨다 */
export function jsonBody(call: { init: RequestInit } | undefined): unknown {
	const body = call?.init.body;
	if (typeof body !== "string") {
		throw new TypeError("JSON 문자열 본문이 없습니다");
	}
	return JSON.parse(body);
}

const A1_RANGE =
	/^'(?<tab>.+)'!(?<col1>[A-Z]+)?(?<row1>\d+)?(?::(?<col2>[A-Z]+)?(?<row2>\d+)?)?$/u;

/** 명시된 끝 → 단일 셀/열/행이면 시작과 같음 → 없으면 무한 */
function rangeEnd(
	explicit: number | undefined,
	single: number | undefined,
): number {
	return explicit ?? single ?? Number.POSITIVE_INFINITY;
}

const COLUMN_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** "A" → 0, "Z" → 25, "AA" → 26 (26진법, A=1) */
function columnIndex(letters: string): number {
	let index = 0;
	for (const letter of letters) {
		index = index * COLUMN_LETTERS.length + COLUMN_LETTERS.indexOf(letter) + 1;
	}
	return index - 1;
}

function toColumn(letters: string | undefined): number | undefined {
	return letters ? columnIndex(letters) : undefined;
}

function toRow(digits: string | undefined): number | undefined {
	return digits ? Number(digits) - 1 : undefined;
}

/** A1 조각 → 0부터 세는 시작/끝 (끝이 없으면 무한) */
function cellBounds(
	c1: string | undefined,
	r1: string | undefined,
	c2: string | undefined,
	r2: string | undefined,
) {
	const col1 = toColumn(c1);
	const row1 = toRow(r1);
	return {
		col1: col1 ?? 0,
		row1: row1 ?? 0,
		// 열만(C:C) 쓰면 그 열 하나, 행만(1:1) 쓰면 그 행 하나
		col2: rangeEnd(toColumn(c2), r1 ? undefined : col1),
		row2: rangeEnd(toRow(r2), c2 ? undefined : row1),
	};
}

/**
 * 메모리 기반 가짜 시트. A1 표기 중 이 앱이 쓰는 형태만 지원한다:
 * '탭'!1:1, '탭'!C:C, '탭'!A:ZZ, '탭'!A5:F5, '탭'!D7
 */
export class FakeSheets implements SheetsClient {
	readonly tabs = new Map<string, string[][]>();
	readonly batchRequests: unknown[] = [];

	private parse(range: string) {
		const groups = A1_RANGE.exec(range)?.groups;
		if (!groups) {
			throw new Error(`지원하지 않는 범위: ${range}`);
		}
		const { tab = "", col1, row1, col2, row2 } = groups;
		const grid = this.tabs.get(tab.replaceAll("''", "'"));
		if (!grid) {
			// 실제 API와 동일하게: 없는 탭 범위는 400 "Unable to parse range"
			throw new SheetsApiError(400, `Unable to parse range: ${tab}`);
		}
		return { grid, ...cellBounds(col1, row1, col2, row2) };
	}

	listSheetTitles() {
		return Promise.resolve(
			[...this.tabs.keys()].map((title, sheetId) => ({ title, sheetId })),
		);
	}
	addSheet(title: string) {
		this.tabs.set(title, []);
		return Promise.resolve(this.tabs.size - 1);
	}
	getValues(range: string) {
		const { grid, col1, row1, col2, row2 } = this.parse(range);
		const rows = grid.slice(
			row1,
			row2 === Number.POSITIVE_INFINITY ? undefined : row2 + 1,
		);
		return Promise.resolve(
			rows.map((row) =>
				row.slice(
					col1,
					col2 === Number.POSITIVE_INFINITY ? undefined : col2 + 1,
				),
			),
		);
	}
	updateValues(range: string, rows: CellValue[][]) {
		const { grid, col1, row1 } = this.parse(range);
		for (const [r, cells] of rows.entries()) {
			const target = grid[row1 + r] ?? [];
			for (const [c, cell] of cells.entries()) {
				if (cell !== null) {
					target[col1 + c] = cell;
				}
			}
			grid[row1 + r] = Array.from(target, (cell) => cell ?? "");
		}
		return Promise.resolve();
	}
	appendValues(range: string, rows: CellValue[][]) {
		const { grid } = this.parse(range);
		for (const row of rows) {
			grid.push(row.map((cell) => cell ?? ""));
		}
		return Promise.resolve();
	}
	batchUpdate(requests: unknown[]) {
		this.batchRequests.push(...requests);
		return Promise.resolve();
	}
}

/** Promise가 반드시 실패해야 하는 경우 그 오류를 꺼낸다. 다른 종류의 오류면 그대로 다시 던진다 */
export async function rejectionOf<E>(
	promise: Promise<unknown>,
	errorType: abstract new (...args: never[]) => E,
): Promise<E> {
	try {
		await promise;
	} catch (error) {
		if (error instanceof errorType) {
			return error;
		}
		throw error;
	}
	throw new Error("실패를 기대했지만 성공했습니다");
}
