import { symmetricDecrypt } from "better-auth/crypto";
import { describe, expect, it } from "vite-plus/test";

import { createDevAdminCredentials } from "../scripts/dev-admin";
import {
	deriveDevTotpSecret,
	secondsUntilNextCode,
	totpCode,
} from "../scripts/dev-admin-totp";

const AUTH_SECRET = "test-only-auth-secret-0123456789abcdef";
/** RFC 6238 부록 B의 SHA-1 키 */
const RFC_SECRET = "12345678901234567890";

describe("TOTP 코드", () => {
	it.each([
		[59_000, "287082"],
		[1_111_111_109_000, "081804"],
		[1_234_567_890_000, "005924"],
		[20_000_000_000_000, "353130"],
	])("RFC 6238 테스트 벡터 (%i ms → %s)", (nowMs, code) => {
		expect(totpCode(RFC_SECRET, nowMs)).toBe(code);
	});

	it("남은 초는 30초 주기 안에서 센다", () => {
		expect(secondsUntilNextCode(0)).toBe(30);
		expect(secondsUntilNextCode(29_999)).toBe(1);
		expect(secondsUntilNextCode(30_000)).toBe(30);
	});
});

describe("파생 키", () => {
	it("같은 비밀값·이메일이면 같고, 다르면 다르다", () => {
		const key = deriveDevTotpSecret(AUTH_SECRET, "a@example.com");
		expect(key).toHaveLength(32);
		expect(deriveDevTotpSecret(AUTH_SECRET, "a@example.com")).toBe(key);
		expect(deriveDevTotpSecret(AUTH_SECRET, "b@example.com")).not.toBe(key);
		expect(deriveDevTotpSecret("other-secret", "a@example.com")).not.toBe(key);
	});

	it("seed가 저장한 TOTP 비밀값과 코드 출력 명령의 키가 같다", async () => {
		const credentials = await createDevAdminCredentials({
			email: "a@example.com",
			authSecret: AUTH_SECRET,
			password: "local-dev-password-2026",
		});
		const stored = await symmetricDecrypt({
			key: AUTH_SECRET,
			data: credentials.stored.encryptedSecret,
		});
		expect(stored).toBe(deriveDevTotpSecret(AUTH_SECRET, "a@example.com"));
	});
});
