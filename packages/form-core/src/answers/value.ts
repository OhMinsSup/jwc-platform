/** 답변 값은 범용 자료구조만 사용한다 (클래스/Date 객체 없음 → 직렬화/저장 자유) */
export type AnswerValue = string | number | boolean | string[];
export type Answers = Record<string, AnswerValue>;

/** 빈 값 판정: 미입력, 공백 문자열, 빈 배열 */
export function isEmptyAnswer(value: unknown): boolean {
	if (value === undefined || value === null) {
		return true;
	}
	if (typeof value === "string") {
		return value.trim() === "";
	}
	if (Array.isArray(value)) {
		return value.length === 0;
	}
	return false;
}
