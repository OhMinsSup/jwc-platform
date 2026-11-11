import type { AnswerValue } from "../answers/value";
import type { FieldDef } from "../definition/fields";
import { columnHeaderOf } from "../definition/fields";
import { FIELD_TYPES } from "./registry";
import type { CellValueKind, FieldTypeSpec, SheetPart } from "./spec";

/** 유니온을 좁힌 채로 레지스트리 항목을 꺼낸다 (타입 안전한 단일 조회 지점) */
function specOf<F extends FieldDef>(field: F): FieldTypeSpec<F> {
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- FIELD_TYPES[field.type]는 항상 field.type에 맞는 항목이지만, 유니온 인덱싱의 상관관계를 TS가 표현하지 못한다
	return FIELD_TYPES[field.type] as unknown as FieldTypeSpec<F>;
}

export type ValueCheck =
	| { ok: true; value: AnswerValue }
	| { ok: false; message: string };

export function checkFieldValue(field: FieldDef, raw: unknown): ValueCheck {
	const result = specOf(field).valueSchema(field).safeParse(raw);
	if (result.success) {
		return { ok: true, value: result.data };
	}
	return {
		ok: false,
		message: result.error.issues[0]?.message ?? "올바르지 않은 값입니다",
	};
}

export function formatFieldValue(field: FieldDef, value: AnswerValue): string {
	return specOf(field).format(field, value);
}

/** 시트 셀 텍스트 → 검증된 값 */
export function parseFieldText(field: FieldDef, text: string): ValueCheck {
	return checkFieldValue(field, specOf(field).fromText(field, text));
}

/** 응답 시트 칸 정보 (선택지는 정의에서 계산한 값) */
export interface SheetCellInfo {
	choices: readonly string[] | null;
	/** 시트에서 나누는 조각들 (없으면 null = 열 하나) */
	parts: readonly SheetPart[] | null;
	value: CellValueKind;
}

export function sheetCellOf(field: FieldDef): SheetCellInfo {
	const { sheet } = specOf(field);
	return {
		value: sheet.value,
		choices: sheet.choices?.(field) ?? null,
		parts: sheet.parts ?? null,
	};
}

/**
 * 나눈 열의 이름 규칙: "참석일시" → "참석일자" / "참석시간" (운영 시트 관례).
 * "…일시"로 끝나지 않으면 "출발 날짜" / "출발 시간"처럼 뒤에 붙인다.
 */
const PART_NAMING: Record<SheetPart, { replace: string; append: string }> = {
	date: { replace: "일자", append: "날짜" },
	time: { replace: "시간", append: "시간" },
};
const DATETIME_SUFFIX = "일시";

export function partHeader(header: string, part: SheetPart): string {
	const naming = PART_NAMING[part];
	return header.endsWith(DATETIME_SUFFIX)
		? `${header.slice(0, -DATETIME_SUFFIX.length)}${naming.replace}`
		: `${header} ${naming.append}`;
}

/**
 * 질문 하나가 시트에서 차지하는 열들.
 * - 나누지 않는 타입: 열 하나 (part: "whole")
 * - 나누는 타입(일시): 조각 열들 + 이전 버전이 만든 통짜 열(legacyOnly, 새 탭에는 만들지 않고 있으면 읽고 쓴다)
 */
export interface FieldSheetColumn {
	header: string;
	legacyOnly: boolean;
	part: "whole" | SheetPart;
}

export function fieldSheetColumns(field: FieldDef): FieldSheetColumn[] {
	const header = columnHeaderOf(field);
	const { parts } = specOf(field).sheet;
	const whole: FieldSheetColumn = {
		header,
		legacyOnly: parts !== undefined,
		part: "whole",
	};
	if (!parts) {
		return [whole];
	}
	return [
		...parts.map((part) => ({
			header: partHeader(header, part),
			legacyOnly: false,
			part,
		})),
		whole,
	];
}

/** 조각 열의 시트 칸 정보 (조각 이름이 곧 값 종류, 선택지 없음) */
export function partCellOf(part: SheetPart): SheetCellInfo {
	return { value: part, choices: null, parts: null };
}
