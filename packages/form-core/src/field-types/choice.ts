import { z } from "zod";

import type { ChoiceField, FieldOf } from "../definition/fields";
import type { FieldTypeSpec } from "./spec";

/** 시트에는 사람이 읽는 label을 쓰고, 값은 value로 저장한다 */
export function labelOf(field: ChoiceField, value: string): string {
	return field.options.find((option) => option.value === value)?.label ?? value;
}

/** label 또는 value 어느 쪽이 와도 value로 복원 */
function valueFromLabel(field: ChoiceField, text: string): string {
	const trimmed = text.trim();
	const match = field.options.find(
		(option) => option.label === trimmed || option.value === trimmed,
	);
	return match?.value ?? trimmed;
}

const MULTI_SEPARATOR = ", ";

/** 선택지 값 목록. 1개 이상임은 정의 스키마(options.min(1))가 보장한다 */
function optionValues(field: ChoiceField): string[] {
	return field.options.map((option) => option.value);
}

export const singleChoiceSpec: FieldTypeSpec<FieldOf<"single_choice">> = {
	valueSchema: (field) => z.enum(optionValues(field), "목록에서 선택해주세요"),
	format: (field, value) => labelOf(field, String(value)),
	fromText: valueFromLabel,
};

export const multiChoiceSpec: FieldTypeSpec<FieldOf<"multi_choice">> = {
	valueSchema: (field) => {
		let schema = z.array(z.enum(optionValues(field), "목록에서 선택해주세요"));
		if (field.minSelect !== undefined) {
			schema = schema.min(
				field.minSelect,
				`${field.minSelect}개 이상 선택해주세요`,
			);
		}
		if (field.maxSelect !== undefined) {
			schema = schema.max(
				field.maxSelect,
				`${field.maxSelect}개 이하로 선택해주세요`,
			);
		}
		return schema.transform((values) => [...new Set(values)]);
	},
	format: (field, value) =>
		(Array.isArray(value) ? value : [String(value)])
			.map((item) => labelOf(field, item))
			.join(MULTI_SEPARATOR),
	fromText: (field, text) =>
		text
			.split(",")
			.map((part) => part.trim())
			.filter(Boolean)
			.map((part) => valueFromLabel(field, part)),
};

export const booleanSpec: FieldTypeSpec<FieldOf<"boolean">> = {
	valueSchema: () => z.boolean("예/아니오 중 선택해주세요"),
	format: (field, value) =>
		value === true ? field.trueLabel : field.falseLabel,
	fromText: (field, text) => {
		const trimmed = text.trim();
		if (trimmed === field.trueLabel || trimmed.toUpperCase() === "TRUE") {
			return true;
		}
		if (trimmed === field.falseLabel || trimmed.toUpperCase() === "FALSE") {
			return false;
		}
		return trimmed;
	},
};

export const ratingSpec: FieldTypeSpec<FieldOf<"rating">> = {
	valueSchema: (field) =>
		z
			.number("점수를 선택해주세요")
			.int()
			.min(1, "점수를 선택해주세요")
			.max(field.scale, `${field.scale}점 이하로 선택해주세요`),
	format: (field, value) => `${String(value)}/${field.scale}`,
	// oxlint-disable-next-line unicorn/prefer-number-coercion -- 시트 셀은 "3/5" 형식이라 앞쪽 정수만 읽는 parseInt가 필요하다 (Number는 NaN)
	fromText: (_field, text) => Number.parseInt(text, 10),
};
