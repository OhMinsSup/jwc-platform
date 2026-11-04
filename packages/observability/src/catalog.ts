/**
 * 이벤트 카탈로그 (데이터). 앱이 이벤트마다 남길 수 있는 필드를 선언하고, 로그/분석은 선언된 필드만 내보낸다(허용 목록).
 * 필드 값은 원시값만. 개인정보(답변, 이름, 전화번호, 문자 본문, 토큰)는 필드로 두지 않는다.
 */

export interface EventSpec {
	/** 제품 분석 이벤트로도 보낸다 (이름의 "."은 "_"로 바뀐다) */
	analytics?: boolean;
	fields: readonly string[];
}

export type EventCatalog = Record<string, EventSpec>;

export type FieldValue = string | number | boolean | null;

/** 이벤트에 선언된 필드만 받는 타입 (모두 선택) */
export type EventFields<C extends EventCatalog, E extends keyof C> = Partial<
	Record<C[E]["fields"][number], FieldValue>
>;

/** 전화번호처럼 보이는 숫자열 (오류 문장 등에 섞여 들어온 경우를 위한 안전망) */
const PHONE_LIKE = /\b0\d{1,2}-?\d{3,4}-?\d{4}\b/gu;
const MAX_STRING_LENGTH = 500;

/** 문자열 값 정리: 전화번호 형태를 가리고 길이를 자른다 */
export function scrub(value: FieldValue): FieldValue {
	if (typeof value !== "string") {
		return value;
	}
	return value.replaceAll(PHONE_LIKE, "[phone]").slice(0, MAX_STRING_LENGTH);
}

/** 선언된 필드만 남기고 문자열 값을 정리한다 (타입을 우회한 호출에 대한 런타임 방어) */
export function allowedFields<C extends EventCatalog, E extends keyof C>(
	catalog: C,
	event: E,
	fields: EventFields<C, E>,
): Record<string, FieldValue> {
	const allowed: readonly string[] = catalog[event]?.fields ?? [];
	const given: Partial<Record<string, FieldValue>> = fields;
	const entries: [string, FieldValue][] = [];
	for (const key of allowed) {
		const value = given[key];
		if (value !== undefined) {
			entries.push([key, scrub(value)]);
		}
	}
	return Object.fromEntries(entries);
}
