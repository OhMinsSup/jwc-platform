import type { Answers, AnswerValue } from "../answers/value";
import { isEmptyAnswer } from "../answers/value";
import type { Condition } from "../definition/condition";

function matches(
	answer: AnswerValue | undefined,
	expected: string | number | boolean,
): boolean {
	if (Array.isArray(answer)) {
		return answer.includes(String(expected));
	}
	return answer === expected;
}

/** 조건식 평가. 순수 함수이며 답변이 없으면 "일치하지 않음"으로 본다. */
export function evaluateCondition(
	condition: Condition,
	answers: Answers,
): boolean {
	switch (condition.op) {
		case "equals": {
			return matches(answers[condition.fieldId], condition.value);
		}
		case "notEquals": {
			return !matches(answers[condition.fieldId], condition.value);
		}
		case "in": {
			return condition.values.some((value) =>
				matches(answers[condition.fieldId], value),
			);
		}
		case "answered": {
			return !isEmptyAnswer(answers[condition.fieldId]);
		}
		case "all": {
			return condition.conditions.every((c) => evaluateCondition(c, answers));
		}
		case "any": {
			return condition.conditions.some((c) => evaluateCondition(c, answers));
		}
		case "not": {
			return !evaluateCondition(condition.condition, answers);
		}
		default: {
			return false;
		}
	}
}
