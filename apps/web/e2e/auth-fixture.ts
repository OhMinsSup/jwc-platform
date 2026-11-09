import { hashPassword } from "better-auth/crypto";

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
