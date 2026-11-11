import type { FormDefinition } from "../definition/definition";
import type { FieldDef } from "../definition/fields";
import { columnHeaderOf } from "../definition/fields";
import { checkFieldValue, sheetCellOf } from "../field-types/values";
import { CELL_CODECS, PART_CODECS } from "./cells";
import type { SheetCell } from "./cells";
import { acceptedHeaders, findColumnByHeader, sheetColumns } from "./columns";
import type { SheetColumn } from "./columns";
import type { ParsedSheetRow, SheetRecord, SheetWriteCell } from "./record";
import { SYSTEM_CELLS } from "./system-cells";

/**
 * 레코드 ↔ 시트 행. 셀 변환은 표에서 찾는다:
 * 운영 컬럼은 SYSTEM_CELLS, 질문 전체 열은 레지스트리의 값 종류(sheet.value) → CELL_CODECS,
 * 일시를 나눈 날짜/시간 열은 PART_CODECS (읽을 때 두 열을 합쳐 하나의 답변으로 검증한다).
 */

const PART_MISSING_MESSAGE = "날짜와 시간을 모두 입력해주세요";

function cellFor(
	definition: FormDefinition,
	column: SheetColumn,
	record: SheetRecord,
): SheetWriteCell {
	if (column.kind === "system") {
		return SYSTEM_CELLS[column.key].write(record, definition);
	}
	const value = record.answers[column.field.id];
	if (value === undefined) {
		return "";
	}
	return column.part === "whole"
		? CELL_CODECS[sheetCellOf(column.field).value].write(column.field, value)
		: PART_CODECS[column.part].write(String(value));
}

/**
 * 레코드 → 시트 행.
 * 실제 시트의 헤더 순서에 맞춰 배치하므로 운영자가 컬럼 순서를 바꿔도 안전하다.
 * 정의에 없는 헤더 칸(과 paid가 없을 때 납입여부 칸)은 기존 값을 보존하도록 null을 넣는다.
 */
export function toSheetRow(
	definition: FormDefinition,
	sheetHeaders: string[],
	record: SheetRecord,
): SheetWriteCell[] {
	const byHeader = new Map(
		sheetColumns(definition).flatMap((column) =>
			acceptedHeaders(column).map((header) => [header, column] as const),
		),
	);
	return sheetHeaders.map((header) => {
		const column = byHeader.get(header.trim());
		return column ? cellFor(definition, column, record) : null;
	});
}

/**
 * 나눈 질문(일시)의 셀 모음: 날짜 열, 시간 열, 그리고 이전 버전의 통짜 열(whole).
 * 모두 모은 뒤 한 번에 정한다: 나눈 열에 값이 있으면 그 값이 최신이고, 없으면 통짜 열을 읽는다.
 */
interface SplitCells {
	date?: SheetCell;
	field: FieldDef;
	time?: SheetCell;
	whole?: { cell: SheetCell; column: SheetColumn; header: string };
}

function isSplitColumn(
	column: SheetColumn | undefined,
): column is Extract<SheetColumn, { kind: "field" }> {
	return column?.kind === "field" && sheetCellOf(column.field).parts !== null;
}

/** 시트 행 → 레코드 (답변 원본은 시트이므로 읽기 경로에서 사용) */
export function parseSheetRow(
	definition: FormDefinition,
	sheetHeaders: string[],
	cells: SheetCell[],
): ParsedSheetRow {
	const parsed: ParsedSheetRow = {
		id: "",
		paid: false,
		answers: {},
		errors: {},
	};
	const split = new Map<string, SplitCells>();
	for (const [index, header] of sheetHeaders.entries()) {
		const column = findColumnByHeader(definition, header);
		const cell = cells[index] ?? "";
		if (isSplitColumn(column)) {
			const collected = split.get(column.field.id) ?? { field: column.field };
			if (column.part === "whole") {
				collected.whole = { cell, column, header };
			} else {
				collected[column.part] = cell;
			}
			split.set(column.field.id, collected);
		} else if (column) {
			applyCell(parsed, column, header, cell);
		}
	}
	for (const collected of split.values()) {
		applySplit(parsed, collected);
	}
	return parsed;
}

function isBlank(cell: SheetCell | undefined): cell is undefined {
	return cell === undefined || String(cell).trim() === "";
}

/** 날짜 열 + 시간 열 → 일시 답변. 둘 다 비면 통짜 열(있으면), 하나만 있으면 오류 */
function applySplit(parsed: ParsedSheetRow, collected: SplitCells): void {
	const { field, date, time, whole } = collected;
	if (isBlank(date) && isBlank(time)) {
		if (whole) {
			applyCell(parsed, whole.column, whole.header, whole.cell);
		}
		return;
	}
	const header = columnHeaderOf(field);
	if (isBlank(date) || isBlank(time)) {
		parsed.errors[header] = PART_MISSING_MESSAGE;
		return;
	}
	const candidate = `${PART_CODECS.date.decode(date)}T${PART_CODECS.time.decode(time)}`;
	const result = checkFieldValue(field, candidate);
	if (result.ok) {
		parsed.answers[field.id] = result.value;
	} else {
		parsed.errors[header] = result.message;
	}
}

function applyCell(
	parsed: ParsedSheetRow,
	column: SheetColumn,
	header: string,
	cell: SheetCell,
): void {
	const trimmed = String(cell).trim();
	if (column.kind === "system") {
		Object.assign(parsed, SYSTEM_CELLS[column.key].read?.(trimmed));
		return;
	}
	if (trimmed === "") {
		return;
	}
	const { field } = column;
	const result = CELL_CODECS[sheetCellOf(field).value].read(field, cell);
	if (result.ok) {
		parsed.answers[field.id] = result.value;
	} else {
		parsed.errors[header] = result.message;
	}
}
