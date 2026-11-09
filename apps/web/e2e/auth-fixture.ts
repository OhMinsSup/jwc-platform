import { createHmac } from "node:crypto";

import type { BrowserContext } from "@playwright/test";
import { hashPassword } from "better-auth/crypto";
import { z } from "zod";

export const E2E_ADMIN = {
	id: "e2e-admin",
	phoneNumber: "01012345678",
	code: "123456",
	email: "e2e@example.com",
	password: "e2e-only-strong-password-2026",
	secret: "e2e-only-not-a-secret-0123456789abcdef",
};

export async function adminSeedSql(now: number): Promise<string> {
	const password = await hashPassword(E2E_ADMIN.password);
	return [
		"DELETE FROM rate_limit_buckets;",
		"DELETE FROM verification WHERE identifier = 'phone-number-otp-01012345678';",
		`INSERT INTO verification (id, identifier, value, expires_at, created_at, updated_at) VALUES ('e2e-phone-code', 'phone-number-otp-01012345678', '123456:0', ${now + 300_000}, ${now}, ${now});`,
		"DELETE FROM user WHERE id = 'e2e-admin';",
		`INSERT INTO user (id, name, email, email_verified, created_at, updated_at) VALUES ('e2e-admin', 'E2E 관리자', 'e2e@example.com', 0, ${now}, ${now});`,
		`INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at) VALUES ('e2e-account', 'e2e-admin', 'credential', 'e2e-admin', '${password}', ${now}, ${now});`,
	].join("\n");
}

/** 휴대전화 인증·2단계 인증을 마친 관리자 세션 (콘솔 화면 동작 검사용). 세션 토큰은 E2E 전용 값 */
const READY_SESSION_TOKEN = "e2e-only-ready-admin-session";
const SESSION_LIFETIME_MS = 86_400_000;

export function readyAdminSessionSql(now: number): string {
	return [
		`UPDATE user SET phone_number = '${E2E_ADMIN.phoneNumber}', phone_number_verified = 1, two_factor_enabled = 1 WHERE id = '${E2E_ADMIN.id}';`,
		`INSERT INTO session (id, token, user_id, expires_at, created_at, updated_at) VALUES ('e2e-ready-session', '${READY_SESSION_TOKEN}', '${E2E_ADMIN.id}', ${now + SESSION_LIFETIME_MS}, ${now}, ${now});`,
	].join("\n");
}

/** 세션을 서버에서 끝낸다 (만료·다른 곳에서 로그아웃과 같은 상태). 브라우저 쿠키는 그대로 둔다 */
export const endReadyAdminSessionSql = `DELETE FROM session WHERE token = '${READY_SESSION_TOKEN}';`;

/** Better Auth 서명 쿠키: 토큰.HMAC-SHA256(BETTER_AUTH_SECRET). 비밀값은 공개 테스트 설정에서 주입된다 */
export async function signInReadyAdmin(
	context: BrowserContext,
	origin: string,
) {
	const { BETTER_AUTH_SECRET } = z
		.object({ BETTER_AUTH_SECRET: z.string().min(1) })
		.parse(process.env);
	const signature = createHmac("sha256", BETTER_AUTH_SECRET)
		.update(READY_SESSION_TOKEN)
		.digest("base64");
	await context.addCookies([
		{
			name: "better-auth.session_token",
			value: encodeURIComponent(`${READY_SESSION_TOKEN}.${signature}`),
			url: origin,
			httpOnly: true,
			sameSite: "Lax",
		},
	]);
}
