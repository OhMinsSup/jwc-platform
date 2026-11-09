/**
 * 클라이언트 분석 카탈로그 (데이터): 이벤트 → 보낼 수 있는 속성 이름, 기능 플래그 → 기본값.
 * 앱이 표를 정의해 createAnalytics에 넘긴다.
 */

export type EventCatalog = Record<string, readonly string[]>;

export type PropValue = string | number | boolean;

export type EventProps<C extends EventCatalog, E extends keyof C> = Partial<
	Record<C[E][number], PropValue>
>;

export type FlagCatalog = Record<string, { default: boolean }>;

/** 선언된 속성만 남긴다 (답변 값 같은 개인정보가 실수로 섞여도 버린다) */
export function allowedProps<C extends EventCatalog, E extends keyof C>(
	catalog: C,
	event: E,
	props: EventProps<C, E>,
): Record<string, PropValue> {
	const allowed: readonly string[] = catalog[event] ?? [];
	const given: Partial<Record<string, PropValue>> = props;
	const entries: [string, PropValue][] = [];
	for (const key of allowed) {
		const value = given[key];
		if (value !== undefined) {
			entries.push([key, value]);
		}
	}
	return Object.fromEntries(entries);
}

/** URL을 담는 PostHog 기본 속성 (sanitizeUrl 대상) */
export const URL_PROPERTIES = [
	"$current_url",
	"$pathname",
	"$referrer",
	"$initial_current_url",
	"$initial_pathname",
] as const;

export function sanitizeUrlProperties(
	properties: Record<string, unknown>,
	sanitizeUrl: (url: string) => string,
): void {
	for (const key of URL_PROPERTIES) {
		const value = properties[key];
		if (typeof value === "string") {
			properties[key] = sanitizeUrl(value);
		}
	}
}
