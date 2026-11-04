import type { Answers } from "./answers/value";
import type { FormDefinition } from "./definition/definition";
import { normalizePhone } from "./field-types";

/**
 * 중복 제출 판정용 정규화 키 (해시 이전 단계).
 * validateAnswers를 통과한 답변을 입력으로 가정한다.
 */
export function identityKey(
	definition: FormDefinition,
	answers: Answers,
): string | null {
	const field = definition.fields.find(
		(f) => f.id === definition.identity.fieldId,
	);
	const value = answers[definition.identity.fieldId];
	if (!field || typeof value !== "string") {
		return null;
	}
	if (field.type === "phone") {
		return normalizePhone(value);
	}
	return value.trim().toLowerCase();
}

export function contactPhone(
	definition: FormDefinition,
	answers: Answers,
): string | null {
	const fieldId = definition.contact?.phoneFieldId;
	const value = fieldId ? answers[fieldId] : undefined;
	return typeof value === "string" ? normalizePhone(value) : null;
}
