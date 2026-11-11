/** 원인 사슬을 몇 단계까지 따라갈지 (순환 cause 방지) */
const MAX_CAUSE_DEPTH = 3;

/**
 * 오류와 그 원인들 (바깥 → 안쪽). DB 드라이버처럼 바깥 오류("Failed query …")가 이유를 cause에만
 * 담는 경우가 있어 로그·판별이 사슬 전체를 본다. 오류 자신 + 원인 최대 MAX_CAUSE_DEPTH개.
 */
export function causeChain(error: unknown): unknown[] {
	const chain: unknown[] = [error];
	let current = error;
	while (current instanceof Error && current.cause !== undefined) {
		if (chain.length > MAX_CAUSE_DEPTH) {
			break;
		}
		current = current.cause;
		chain.push(current);
	}
	return chain;
}
