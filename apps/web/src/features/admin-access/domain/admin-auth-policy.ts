const SECOND_MS = 1000;
const MINUTE_SECONDS = 60;
const DAY_SECONDS = 86_400;

export const ADMIN_AUTH_POLICY = {
	password: { minLength: 10, maxLength: 128 },
	sms: { codeLength: 6, expiresInSeconds: 5 * MINUTE_SECONDS, maxAttempts: 3 },
	totp: { codeLength: 6 },
	session: { expiresInSeconds: 7 * DAY_SECONDS },
	invite: { expiresInMs: 7 * DAY_SECONDS * SECOND_MS },
} as const;
