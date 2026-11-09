/**
 * 코드에서 정의한 상수 레코드(`{ draft: ..., open: ... } as const`)의 키를 키 타입 그대로 돌려준다.
 *
 * 외부 입력 객체에는 쓰지 않는다: 런타임 객체는 타입에 없는 키를 더 가질 수 있어 이 단언이 틀릴 수 있다.
 * 그런 값은 zod 등으로 먼저 검증한다.
 */
export function keysOf<K extends string>(
	record: Readonly<Record<K, unknown>>,
): K[] {
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- 코드 상수 레코드 전용(위 설명). Object.keys는 string[]만 돌려준다
	return Object.keys(record) as K[];
}
