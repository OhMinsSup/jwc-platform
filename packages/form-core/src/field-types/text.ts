import { z } from "zod";

import type { FieldOf } from "../definition/fields";
import type { FieldTypeSpec } from "./spec";

const KR_MOBILE_PATTERN = /^01[016789]\d{7,8}$/u;
const NON_DIGIT = /\D/gu;
const KR_COUNTRY_PREFIX = "82";

/** "+82 10-1234-5678", "010.1234.5678" → "01012345678" */
export function normalizePhone(raw: string): string {
	const digits = raw.replaceAll(NON_DIGIT, "");
	if (digits.startsWith(KR_COUNTRY_PREFIX) && digits.length >= 11) {
		return `0${digits.slice(KR_COUNTRY_PREFIX.length)}`;
	}
	return digits;
}

export function formatPhone(digits: string): string {
	if (digits.length === 11) {
		return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
	}
	if (digits.length === 10) {
		return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
	}
	return digits;
}

const asText = (_field: unknown, value: unknown) => String(value);
const trimmed = (_field: unknown, text: string) => text.trim();

export const shortTextSpec: FieldTypeSpec<FieldOf<"short_text">> = {
	valueSchema: (field) =>
		z
			.string("텍스트를 입력해주세요")
			.trim()
			.min(field.minLength ?? 1, `${field.minLength ?? 1}자 이상 입력해주세요`)
			.max(field.maxLength, `${field.maxLength}자 이내로 입력해주세요`),
	format: asText,
	fromText: trimmed,
};

export const longTextSpec: FieldTypeSpec<FieldOf<"long_text">> = {
	valueSchema: (field) =>
		z
			.string("텍스트를 입력해주세요")
			.trim()
			.max(field.maxLength, `${field.maxLength}자 이내로 입력해주세요`),
	format: asText,
	fromText: trimmed,
};

export const emailSpec: FieldTypeSpec<FieldOf<"email">> = {
	valueSchema: () =>
		z
			.string()
			.trim()
			.toLowerCase()
			.pipe(z.email("올바른 이메일 주소를 입력해주세요")),
	format: asText,
	fromText: trimmed,
};

export const phoneSpec: FieldTypeSpec<FieldOf<"phone">> = {
	valueSchema: () =>
		z
			.string("전화번호를 입력해주세요")
			.transform(normalizePhone)
			.refine(
				(digits) => KR_MOBILE_PATTERN.test(digits),
				"올바른 휴대전화 번호를 입력해주세요",
			),
	format: (_field, value) => formatPhone(String(value)),
	fromText: trimmed,
};
