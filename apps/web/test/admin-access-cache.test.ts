import { describe, expect, it } from "vite-plus/test";

import { createAdminAccessCache } from "../src/features/admin-access/ui/admin-access-cache";

const ADMIN = { id: "admin-1", email: "a@example.com", name: "관리자" };
const TTL_MS = 300_000;

describe("관리자 접근 확인 캐시", () => {
	it("기억한 관리자를 유효 시간 안에서만 돌려준다", () => {
		const cache = createAdminAccessCache({ enabled: true, ttlMs: TTL_MS });
		expect(cache.read(0)).toBeNull();
		cache.remember(ADMIN, 1000);
		expect(cache.read(1000 + TTL_MS - 1)).toStrictEqual(ADMIN);
		expect(cache.read(1000 + TTL_MS)).toBeNull();
	});

	it("지운 뒤에는 다시 서버에서 확인하게 한다 (로그아웃·재로그인)", () => {
		const cache = createAdminAccessCache({ enabled: true, ttlMs: TTL_MS });
		cache.remember(ADMIN, 0);
		cache.forget();
		expect(cache.read(1)).toBeNull();
	});

	it("서버(SSR)에서는 아무것도 기억하지 않는다: 워커 isolate에서 사용자끼리 섞이지 않게", () => {
		const cache = createAdminAccessCache({ enabled: false, ttlMs: TTL_MS });
		cache.remember(ADMIN, 0);
		expect(cache.read(1)).toBeNull();
	});
});
