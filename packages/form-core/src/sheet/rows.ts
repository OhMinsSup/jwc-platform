import type { Answers } from "../answers/value";
import type { FormDefinition } from "../definition/definition";
import { PAID_LABELS } from "../definition/system-columns";
import { formatFieldValue, parseFieldText } from "../field-types/values";
import { formatInTimeZone } from "../time";
import { findColumnByHeader, sheetColumns } from "./columns";
import type { SheetColumn } from "./columns";

/** 시트 1행에 해당하는 레코드. 타임스탬프는 epoch ms. */
export interface SheetRecord {
	answers: Answers;
	id: string;
	/** undefined면 쓰지 않는다(기존 셀 보존). 재제출이 운영자가 바꾼 납입 여부를 덮어쓰지 않게 한다 */
	paid?: boolean;
	submittedAt: number;
	updatedAt: number;
}

function cellFor(
	definition: FormDefinition,
	column: SheetColumn,
	record: SheetRecord,
): string | null {
	if (column.kind === "field") {
		const value = record.answers[column.field.id];
		return value === undefined ? "" : formatFieldValue(column.field, value);
	}
	switch (column.key) {
		case "id": {
			return record.id;
		}
		case "submittedAt": {
			return formatInTimeZone(record.submittedAt, definition.timezone);
		}
		case "updatedAt": {
			return formatInTimeZone(record.updatedAt, definition.timezone);
		}
		case "paid": {
			if (record.paid === undefined) {
				return null;
			}
			return record.paid ? PAID_LABELS.true : PAID_LABELS.false;
		}
		default: {
			return "";
		}
	}
}

/**
 * 레코드 → 시트 행.
 * 실제 시트의 헤더 순서에 맞춰 배치하므로 운영자가 컬럼 순서를 바꿔도 안전하다.
 * 시트에 없는 헤더는 무시, 정의에 없는 헤더 칸(과 paid가 없을 때 납입여부 칸)은 기존 값을 보존하도록 null을 넣는다.
 */
export function toSheetRow(
	definition: FormDefinition,
	sheetHeaders: string[],
	record: SheetRecord,
): (string | null)[] {
	const byHeader = new Map(
		sheetColumns(definition).map((column) => [column.header, column]),
	);
	return sheetHeaders.map((header) => {
		const column = byHeader.get(header.trim());
		return column ? cellFor(definition, column, record) : null;
	});
}

export interface ParsedSheetRow {
	answers: Answers;
	/** 해석하지 못한 셀: header → 이유 */
	errors: Record<string, string>;
	id: string;
	paid: boolean;
}

/** 시트 행 → 레코드 (답변 원본은 시트이므로 읽기 경로에서 사용) */
export function parseSheetRow(
	definition: FormDefinition,
	sheetHeaders: string[],
	cells: string[],
): ParsedSheetRow {
	const parsed: ParsedSheetRow = {
		id: "",
		paid: false,
		answers: {},
		errors: {},
	};
	for (const [index, header] of sheetHeaders.entries()) {
		const column = findColumnByHeader(definition, header);
		if (column) {
			applyCell(parsed, column, header, cells[index] ?? "");
		}
	}
	return parsed;
}

function applyCell(
	parsed: ParsedSheetRow,
	column: SheetColumn,
	header: string,
	text: string,
): void {
	const trimmed = text.trim();
	if (column.kind === "system") {
		if (column.key === "id") {
			parsed.id = trimmed;
		} else if (column.key === "paid") {
			parsed.paid = trimmed === PAID_LABELS.true;
		}
		return;
	}
	if (trimmed === "") {
		return;
	}
	const result = parseFieldText(column.field, text);
	if (result.ok) {
		parsed.answers[column.field.id] = result.value;
	} else {
		parsed.errors[header] = result.message;
	}
}
