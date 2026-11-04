import type { FormDefinition } from "../definition/definition";
import { isDisplayOnly } from "../definition/fields";
import { checkFieldValue } from "../field-types";
import { resolveVisibility } from "../logic/visibility";
import type { Answers } from "./value";
import { isEmptyAnswer } from "./value";

export const REQUIRED_MESSAGE = "필수 항목입니다";

export type AnswerValidation =
	| { ok: true; answers: Answers }
	| { ok: false; errors: Record<string, string>; answers: Answers };

/**
 * 답변 검증.
 * - 표시되지 않는 필드의 답변은 버린다(숨김 필드가 시트/메시지로 새지 않도록).
 * - scope를 주면 해당 필드들만 검사한다(페이지 단위 검증).
 * - 반환되는 answers는 정규화된 값(예: 전화번호 숫자만)만 담는다.
 */
export function validateAnswers(
	definition: FormDefinition,
	raw: Record<string, unknown>,
	scope?: ReadonlySet<string>,
): AnswerValidation {
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- 표시 판정은 값을 비교/복사만 하고, 남는 값은 아래 checkFieldValue가 하나씩 검증한다
	const visibility = resolveVisibility(definition, raw as Answers);
	const fields = new Map(definition.fields.map((field) => [field.id, field]));
	const answers: Answers = {};
	const errors: Record<string, string> = {};

	for (const id of visibility.fieldIds) {
		const field = fields.get(id);
		if (!field || isDisplayOnly(field) || (scope && !scope.has(id))) {
			continue;
		}
		const value = visibility.answers[id];
		if (isEmptyAnswer(value)) {
			if (field.required) {
				errors[id] = REQUIRED_MESSAGE;
			}
			continue;
		}
		const checked = checkFieldValue(field, value);
		if (checked.ok) {
			answers[id] = checked.value;
		} else {
			errors[id] = checked.message;
		}
	}

	return Object.keys(errors).length === 0
		? { ok: true, answers }
		: { ok: false, errors, answers };
}

/** 특정 페이지에 속한 필드만 검사 */
export function validatePage(
	definition: FormDefinition,
	raw: Record<string, unknown>,
	pageId: string,
): AnswerValidation {
	const page = definition.pages.find((p) => p.id === pageId);
	return validateAnswers(definition, raw, new Set(page?.fieldIds));
}
