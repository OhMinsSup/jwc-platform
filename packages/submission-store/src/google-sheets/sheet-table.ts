import type { FormDefinition } from "@jwc/form-core/definition/definition";
import {
	PAID_LABELS,
	systemColumnOf,
} from "@jwc/form-core/definition/system-columns";
import {
	missingHeaders,
	systemColumnIndex,
} from "@jwc/form-core/sheet/columns";
import type {
	ParsedSheetRow,
	SheetRecord,
	SheetWriteCell,
} from "@jwc/form-core/sheet/record";
import { parseSheetRow, toSheetRow } from "@jwc/form-core/sheet/rows";
import type { ReadCell } from "@jwc/google/cell-data";
import { columnLetter, SheetsApiError } from "@jwc/google/sheets-client";
import type { SheetsClient } from "@jwc/google/sheets-client";

import { a1 as range, ensureSheetLayout, readHeaders } from "./sheet-layout";
import type { TabCache } from "./tab-cache";

/**
 * Google Sheets 탭 1개를 표처럼 다루는 저수준 함수 (어댑터 store.ts가 사용). 탭 준비/디자인은 sheet-layout.ts.
 * - 1행은 헤더. 헤더 텍스트로 컬럼을 찾으므로 운영자가 열 순서를 바꿔도 동작한다.
 * - 행은 응답 ID 컬럼으로 찾는다 (정렬/필터 후에도 안전).
 */

const HEADER_RANGE_COLUMNS = "1:1";
const BAD_REQUEST = 400;

export class SheetLayoutError extends Error {
	override name = "SheetLayoutError";
}

/** 탭이 없으면(운영자가 삭제, 발행 전 등) Sheets API는 400을 준다 → 빈 표로 본다 */
async function readValuesIfTabExists(
	client: SheetsClient,
	a1: string,
): Promise<ReadCell[][]> {
	try {
		return await client.getValues(a1);
	} catch (error) {
		if (error instanceof SheetsApiError && error.status === BAD_REQUEST) {
			return [];
		}
		throw error;
	}
}

async function readHeadersIfTabExists(
	client: SheetsClient,
	sheetName: string,
): Promise<string[]> {
	const [headers = []] = await readValuesIfTabExists(
		client,
		range(sheetName, HEADER_RANGE_COLUMNS),
	);
	return headers.map((header) => String(header).trim());
}

function idColumnIndex(headers: string[]): number {
	const index = systemColumnIndex(headers, "id");
	if (index === -1) {
		throw new SheetLayoutError(
			`시트에 "${systemColumnOf("id").header}" 컬럼이 없습니다`,
		);
	}
	return index;
}

/** 응답 ID로 시트 행 번호(1-base)를 찾는다. 없으면 null */
async function findRowNumber(
	client: SheetsClient,
	sheetName: string,
	headers: string[],
	id: string,
): Promise<number | null> {
	const letter = columnLetter(idColumnIndex(headers) + 1);
	const cells = await client.getValues(range(sheetName, `${letter}:${letter}`));
	const index = cells.findIndex(
		(row, i) => i > 0 && String(row[0] ?? "").trim() === id,
	);
	return index === -1 ? null : index + 1;
}

function isBadRequest(error: unknown): boolean {
	return error instanceof SheetsApiError && error.status === BAD_REQUEST;
}

interface AppendInput {
	definition: FormDefinition;
	headers: string[];
	row: SheetWriteCell[];
	sheetName: string;
}

/**
 * 새 응답 행 추가. 탭에 응답 표(A1에서 시작하는 시트 "표")가 있으면 표 본문에 넣어 표가 함께 늘어나게 하고,
 * 없으면(표를 만들 수 없던 탭) 시트 끝에 값을 붙인다.
 * 캐시한 표가 그새 지워졌으면(400, 반영되지 않음) 탭 정보를 다시 읽어 한 번만 다시 시도한다.
 */
async function appendRow(
	client: SheetsClient,
	tabs: TabCache,
	input: AppendInput,
	retried = false,
): Promise<void> {
	const { sheetName, definition, headers, row } = input;
	const handle = await tabs.handle(sheetName, definition, headers);
	if (handle?.tableId) {
		try {
			await client.appendTableRows(
				{ sheetId: handle.sheetId, tableId: handle.tableId },
				[row],
			);
			return;
		} catch (error) {
			if (retried || !isBadRequest(error)) {
				throw error;
			}
			tabs.forget(sheetName);
			await appendRow(client, tabs, input, true);
			return;
		}
	}
	await client.appendValues(
		range(sheetName, `A1:${columnLetter(headers.length)}1`),
		[row.map((cell) => cell ?? "")],
	);
}

/**
 * 레코드 쓰기: 행이 있으면 갱신, 없으면 추가. 재시도해도 중복 행이 생기지 않는다.
 * 탭 정보는 캐시에서 얻는다 (탭마다 처음 한 번 읽고 날짜·시간 서식을 다시 건다).
 */
export async function writeRecord(
	client: SheetsClient,
	tabs: TabCache,
	sheetName: string,
	definition: FormDefinition,
	record: SheetRecord,
): Promise<void> {
	let headers = await readHeadersIfTabExists(client, sheetName);
	if (missingHeaders(definition, headers).length > 0) {
		headers = await ensureSheetLayout(client, sheetName, definition);
		tabs.forget(sheetName);
	}
	const row = toSheetRow(definition, headers, record);
	const rowNumber = await findRowNumber(client, sheetName, headers, record.id);
	if (rowNumber === null) {
		await appendRow(client, tabs, { sheetName, definition, headers, row });
		return;
	}
	await tabs.handle(sheetName, definition, headers);
	const lastColumn = columnLetter(headers.length);
	await client.updateValues(
		range(sheetName, `A${rowNumber}:${lastColumn}${rowNumber}`),
		[row],
	);
}

/** 납입여부 셀만 쓴다. 응답 행이 없으면 false */
export async function writePaidCell(
	client: SheetsClient,
	sheetName: string,
	id: string,
	paid: boolean,
): Promise<boolean> {
	const headers = await readHeaders(client, sheetName);
	const paidIndex = systemColumnIndex(headers, "paid");
	if (paidIndex === -1) {
		throw new SheetLayoutError(
			`시트에 "${systemColumnOf("paid").header}" 컬럼이 없습니다`,
		);
	}
	const rowNumber = await findRowNumber(client, sheetName, headers, id);
	if (rowNumber === null) {
		return false;
	}
	const cell = `${columnLetter(paidIndex + 1)}${rowNumber}`;
	await client.updateValues(range(sheetName, cell), [
		[paid ? PAID_LABELS.true : PAID_LABELS.false],
	]);
	return true;
}

/**
 * 시트 전체를 읽어 행 순서대로 반환 (목록/알림 배치용, API 호출 1회).
 * 응답 ID가 없는 행(운영자가 직접 추가한 메모 행 등)은 건너뛴다. 같은 ID가 여러 행이면 첫 행만 쓴다.
 */
export async function readAllRecords(
	client: SheetsClient,
	sheetName: string,
	definition: FormDefinition,
): Promise<ParsedSheetRow[]> {
	const [headerCells = [], ...rows] = await readValuesIfTabExists(
		client,
		range(sheetName, "A:ZZ"),
	);
	const headers = headerCells.map((header) => String(header).trim());
	const seen = new Set<string>();
	const records: ParsedSheetRow[] = [];
	for (const cells of rows) {
		const parsed = parseSheetRow(definition, headers, cells);
		if (parsed.id && !seen.has(parsed.id)) {
			seen.add(parsed.id);
			records.push(parsed);
		}
	}
	return records;
}

/** 단일 응답 읽기 (헤더 + ID 컬럼 + 행, API 호출 3회). 탭이 없으면 null */
export async function readRecord(
	client: SheetsClient,
	sheetName: string,
	definition: FormDefinition,
	id: string,
): Promise<ParsedSheetRow | null> {
	const headers = await readHeadersIfTabExists(client, sheetName);
	if (headers.length === 0) {
		return null;
	}
	const rowNumber = await findRowNumber(client, sheetName, headers, id);
	if (rowNumber === null) {
		return null;
	}
	const [cells = []] = await client.getValues(
		range(
			sheetName,
			`A${rowNumber}:${columnLetter(headers.length)}${rowNumber}`,
		),
	);
	return parseSheetRow(definition, headers, cells);
}
