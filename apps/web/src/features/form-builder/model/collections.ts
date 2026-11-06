/** 배열 불변 조작 유틸. 범위를 벗어나면 원본을 그대로 돌려준다 (no-op은 같은 참조). */

export function moveItem<T>(items: T[], from: number, to: number): T[] {
	if (
		from === to ||
		from < 0 ||
		to < 0 ||
		from >= items.length ||
		to >= items.length
	) {
		return items;
	}
	const next = [...items];
	// 범위를 확인했으므로 꺼낸 항목은 정확히 하나다
	const moved = next.splice(from, 1);
	next.splice(to, 0, ...moved);
	return next;
}

export function insertAt<T>(items: readonly T[], index: number, item: T): T[] {
	const at = Math.max(0, Math.min(index, items.length));
	return [...items.slice(0, at), item, ...items.slice(at)];
}

export function replaceWhere<T>(
	items: readonly T[],
	match: (item: T) => boolean,
	update: (item: T) => T,
): T[] {
	return items.map((item) => (match(item) ? update(item) : item));
}
