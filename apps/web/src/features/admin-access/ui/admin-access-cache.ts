import type { AdminIdentity } from "../domain/admin-auth-state";

/**
 * 관리자 콘솔 `beforeLoad`의 접근 확인 결과를 브라우저에서 잠시 재사용한다 (Worker 요청 수 절감).
 *
 * - 화면 이동·미리 불러오기·invalidate마다 서버에 다시 묻지 않는다. 데이터 보호는 모든 관리자
 *   서버 함수의 `adminOnly`가 매번 하고, 세션이 끝났으면 거기서 로그인 화면으로 redirect한다.
 * - "ready" 결과만 기억한다. 그 밖의 결정은 어차피 다른 화면으로 보낸다.
 * - SSR에서는 끈다: 워커 isolate의 모듈 상태는 요청(사용자) 사이에 공유되기 때문이다.
 */

/** 기억한 결과를 믿는 시간. 지나면 다음 이동에서 서버에 다시 확인한다 */
const ADMIN_ACCESS_RECHECK_MS = 5 * 60_000;

interface Entry {
	admin: AdminIdentity;
	checkedAt: number;
}

export function createAdminAccessCache(options: {
	enabled: boolean;
	ttlMs: number;
}) {
	let entry: Entry | null = null;
	return {
		read(now: number): AdminIdentity | null {
			if (!entry || now - entry.checkedAt >= options.ttlMs) {
				return null;
			}
			return entry.admin;
		},
		remember(admin: AdminIdentity, now: number): void {
			if (options.enabled) {
				entry = { admin, checkedAt: now };
			}
		},
		forget(): void {
			entry = null;
		},
	};
}

export const adminAccessCache = createAdminAccessCache({
	enabled: typeof window !== "undefined",
	ttlMs: ADMIN_ACCESS_RECHECK_MS,
});
