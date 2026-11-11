import { causeChain } from "./errors/cause-chain";

/**
 * DB 드라이버 오류 판별. D1/SQLite는 제약 위반을 문장으로만 알려 주고,
 * drizzle은 그 오류를 "Failed query …" 오류의 cause로 감싼다 → 원인 사슬에서 찾는다.
 */

const UNIQUE_VIOLATION = "UNIQUE constraint failed";

export function isUniqueViolation(error: unknown): boolean {
	return causeChain(error).some(
		(link) => link instanceof Error && link.message.includes(UNIQUE_VIOLATION),
	);
}
