import type { AnswerValue } from "../answers/value";
import type { FieldDef } from "../definition/fields";
import { FIELD_TYPES } from "./registry";
import type { FieldTypeSpec } from "./spec";

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
