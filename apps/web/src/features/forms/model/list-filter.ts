/** 목록 화면 공용: 검색어 + 상태 필터 (순수 함수, 테스트 대상) */

export type StatusFilter<S extends string> = S | "all";

/** 공백 무시, 대소문자 무시 부분 일치. 빈 검색어는 모두 통과 */
export function matchesQuery(
	query: string,
	...texts: readonly string[]
): boolean {
	const needle = query.trim().toLowerCase();
	return (
		needle === "" || texts.some((text) => text.toLowerCase().includes(needle))
	);
}

/** 상태별 개수. "all"은 전체 개수, statuses에 있는 상태는 0개여도 들어간다 */
export function countByStatus<S extends string>(
	items: readonly { status: S }[],
	statuses: readonly S[],
): ReadonlyMap<StatusFilter<S>, number> {
	const counts = new Map<StatusFilter<S>, number>([["all", items.length]]);
	for (const status of statuses) {
		counts.set(status, 0);
	}
	for (const item of items) {
		counts.set(item.status, (counts.get(item.status) ?? 0) + 1);
	}
	return counts;
}
