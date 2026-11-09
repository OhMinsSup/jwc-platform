import type { FormDefinition } from "@jwc/form-core/definition/definition";
import { isChoiceField } from "@jwc/form-core/definition/fields";
import {
	PAID_LABELS,
	SYSTEM_COLUMNS,
} from "@jwc/form-core/definition/system-columns";
import { headerRow, sheetColumns } from "@jwc/form-core/sheet/columns";
import { parseSheetRow, toSheetRow } from "@jwc/form-core/sheet/rows";
import type { ParsedSheetRow, SheetRecord } from "@jwc/form-core/sheet/rows";
import {
	columnLetter,
	quoteSheetName,
	SheetsApiError,
} from "@jwc/google/sheets-client";
import type { SheetsClient } from "@jwc/google/sheets-client";

/**
 * Google Sheets 탭 1개를 표처럼 다루는 저수준 함수 (어댑터 google-sheets-store.ts가 사용).
 * - 1행은 헤더. 헤더 텍스트로 컬럼을 찾으므로 운영자가 열 순서를 바꿔도 동작한다.
 * - 행은 응답 ID 컬럼으로 찾는다 (정렬/필터 후에도 안전).
 */

const HEADER_RANGE_COLUMNS = "1:1";
const MAX_DROPDOWN_ROWS = 5000;
const BAD_REQUEST = 400;

export class SheetLayoutError extends Error {
	override name = "SheetLayoutError";
}

function range(sheetName: string, a1: string): string {
	return `${quoteSheetName(sheetName)}!${a1}`;
}

async function readHeaders(
	client: SheetsClient,
	sheetName: string,
): Promise<string[]> {
	const [headers = []] = await client.getValues(
		range(sheetName, HEADER_RANGE_COLUMNS),
	);
	return headers.map((header) => header.trim());
}

/** 탭이 없으면(운영자가 삭제, 발행 전 등) Sheets API는 400을 준다 → 빈 표로 본다 */
async function readValuesIfTabExists(
	client: SheetsClient,
	a1: string,
): Promise<string[][]> {
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
	return headers.map((header) => header.trim());
}

/** 탭이 없으면 만들고, 정의에 있는데 시트에 없는 헤더를 오른쪽에 추가한다. 기존 열은 건드리지 않는다. */
export async function ensureSheetLayout(
	client: SheetsClient,
	sheetName: string,
	definition: FormDefinition,
): Promise<string[]> {
	const tabs = await client.listSheetTitles();
	let sheetId = tabs.find((tab) => tab.title === sheetName)?.sheetId;
	sheetId ??= await client.addSheet(sheetName);
	const existing = await readHeaders(client, sheetName);
	const missing = headerRow(definition).filter(
		(header) => !existing.includes(header),
	);
	const headers = [...existing, ...missing];
	if (missing.length > 0) {
		await client.updateValues(
			range(sheetName, `A1:${columnLetter(headers.length)}1`),
			[headers],
		);
	}
	await client.batchUpdate([
		freezeHeader(sheetId),
		...dropdownRules(sheetId, definition, headers),
	]);
	return headers;
}

function freezeHeader(sheetId: number) {
	return {
		updateSheetProperties: {
			properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
			fields: "gridProperties.frozenRowCount",
		},
	};
}

/** 선택형 컬럼과 납입여부 컬럼에 드롭다운 검증을 건다 (운영자 입력 오류 예방) */
function dropdownRules(
	sheetId: number,
	definition: FormDefinition,
	headers: string[],
) {
	const rules: { header: string; values: string[] }[] = [];
	for (const column of sheetColumns(definition)) {
		if (column.kind === "system" && column.key === "paid") {
			rules.push({
				header: column.header,
				values: [PAID_LABELS.true, PAID_LABELS.false],
			});
		}
		if (
			column.kind === "field" &&
			column.field.type === "single_choice" &&
			isChoiceField(column.field)
		) {
			rules.push({
				header: column.header,
				values: column.field.options.map((option) => option.label),
			});
		}
	}
	return rules
		.map((rule) => ({ ...rule, index: headers.indexOf(rule.header) }))
		.filter((rule) => rule.index >= 0)
		.map((rule) => ({
			setDataValidation: {
				range: {
					sheetId,
					startRowIndex: 1,
					endRowIndex: MAX_DROPDOWN_ROWS,
					startColumnIndex: rule.index,
					endColumnIndex: rule.index + 1,
				},
				rule: {
					condition: {
						type: "ONE_OF_LIST",
						values: rule.values.map((value) => ({ userEnteredValue: value })),
					},
					strict: true,
					showCustomUi: true,
				},
			},
		}));
}

function idColumnIndex(headers: string[]): number {
	const index = headers.indexOf(SYSTEM_COLUMNS.id);
	if (index === -1) {
		throw new SheetLayoutError(`시트에 "${SYSTEM_COLUMNS.id}" 컬럼이 없습니다`);
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
	const index = cells.findIndex((row, i) => i > 0 && row[0]?.trim() === id);
	return index === -1 ? null : index + 1;
}

/** 레코드 쓰기: 행이 있으면 갱신, 없으면 추가. 재시도해도 중복 행이 생기지 않는다. */
export async function writeRecord(
	client: SheetsClient,
	sheetName: string,
	definition: FormDefinition,
	record: SheetRecord,
): Promise<void> {
	let headers = await readHeadersIfTabExists(client, sheetName);
	if (headerRow(definition).some((header) => !headers.includes(header))) {
		headers = await ensureSheetLayout(client, sheetName, definition);
	}
	const row = toSheetRow(definition, headers, record);
	const rowNumber = await findRowNumber(client, sheetName, headers, record.id);
	const lastColumn = columnLetter(headers.length);
	if (rowNumber === null) {
		await client.appendValues(range(sheetName, `A1:${lastColumn}1`), [
			row.map((cell) => cell ?? ""),
		]);
		return;
	}
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
	const paidIndex = headers.indexOf(SYSTEM_COLUMNS.paid);
	if (paidIndex === -1) {
		throw new SheetLayoutError(
			`시트에 "${SYSTEM_COLUMNS.paid}" 컬럼이 없습니다`,
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
	const [headers = [], ...rows] = await readValuesIfTabExists(
		client,
		range(sheetName, "A:ZZ"),
	);
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
