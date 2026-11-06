import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { z } from "zod";

import { parseAdminDirectory } from "../src/features/admin-access/domain/admin-directory";
import { normalizeEmail } from "../src/features/admin-access/domain/admin-signup";
import { createAdminSignup } from "../src/features/admin-access/server/admin-signup";
import { adminAuthOptions } from "../src/features/admin-access/server/auth-options";
import { phoneOperations } from "../src/features/admin-access/server/phone-operations";
import { signupStore } from "./signup-store";
import { totp } from "./totp";

const AUTH_SITE = "https://forms.example.org";
export const AUTH_EMAIL = "admin@example.org";
export const AUTH_PHONE = "01012345678";
export const AUTH_PASSWORD = "test-only-strong-password-2026";
export const SECOND_ADMIN = {
	email: "other@example.org",
	phoneNumber: "01087654321",
};

export function authFixture(bootstrapEnabled = true) {
	const sms: { phone: string; code: string }[] = [];
	const database = {
		user: [],
		session: [],
		account: [],
		verification: [],
		twoFactor: [],
	};
	const directory = parseAdminDirectory({
		emails: `${AUTH_EMAIL},${SECOND_ADMIN.email}`,
		phones: `${AUTH_EMAIL}=${AUTH_PHONE},${SECOND_ADMIN.email}=${SECOND_ADMIN.phoneNumber}`,
	});
	const registrationFor = (email: string) =>
		directory.get(normalizeEmail(email)) ?? null;
	const options = adminAuthOptions({
		siteUrl: AUTH_SITE,
		secret: "test-only-auth-secret-longer-than-32-characters",
		registrationFor,
		sendSms: (phone, code) => {
			sms.push({ phone, code });
			return Promise.resolve();
		},
	});
	const auth = betterAuth({
		...options,
		database: memoryAdapter(database),
		rateLimit: { enabled: false },
		logger: { disabled: true },
	});
	const invites = signupStore(() => Promise.resolve(database.user.length));
	const signup = createAdminSignup({
		auth,
		invites: invites.repository,
		bootstrapEnabled,
		registrationFor,
		hashInvite: (code) => Promise.resolve(`test-hash:${code}`),
	});
	return {
		auth,
		sms,
		signup,
		invites,
		browser: authBrowser(auth),
		phone: phoneOperations(
			auth,
			(email) => registrationFor(email)?.phoneNumber ?? null,
		),
	};
}

export function authBrowser(auth: {
	handler: (request: Request) => Promise<Response>;
}) {
	const cookies = new Map<string, string>();
	async function request(path: string, body?: unknown) {
		const response = await auth.handler(
			new Request(new URL(path, `${AUTH_SITE}/api/auth/`), {
				method: body === undefined ? "GET" : "POST",
				headers: {
					origin: AUTH_SITE,
					"content-type": "application/json",
					cookie: [...cookies]
						.map(([key, value]) => `${key}=${value}`)
						.join("; "),
				},
				...(body === undefined ? {} : { body: JSON.stringify(body) }),
			}),
		);
		for (const header of response.headers.getSetCookie()) {
			const pair = header.split(";")[0] ?? "";
			const separator = pair.indexOf("=");
			if (separator > 0) {
				cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
			}
		}
		return response;
	}
	return {
		request,
		headers: () =>
			new Headers({
				cookie: [...cookies]
					.map(([key, value]) => `${key}=${value}`)
					.join("; "),
			}),
	};
}

export async function registerAdmin(fixture: ReturnType<typeof authFixture>) {
	await fixture.phone.requestCode({
		email: AUTH_EMAIL,
		phoneNumber: AUTH_PHONE,
	});
	const code = fixture.sms.at(-1)?.code;
	if (!code) {
		throw new Error("인증 문자가 없습니다");
	}
	return await fixture.signup(
		{
			name: "테스트 관리자",
			email: AUTH_EMAIL,
			phoneNumber: AUTH_PHONE,
			code,
			password: AUTH_PASSWORD,
		},
		fixture.browser.headers(),
		Date.now(),
	);
}

export async function jsonOf(response: Response) {
	const value: unknown = await response.json();
	return z.looseObject({}).parse(value);
}

export function signIn(
	browser: ReturnType<typeof authBrowser>,
	password = AUTH_PASSWORD,
) {
	return browser.request("sign-in/email", { email: AUTH_EMAIL, password });
}

export async function sessionOf(
	browser: ReturnType<typeof authBrowser>,
): Promise<unknown> {
	const response = await browser.request("get-session");
	return await response.json();
}

export async function verifiedAdmin() {
	const fixture = authFixture();
	await registerAdmin(fixture);
	await signIn(fixture.browser);
	return fixture;
}

export async function startEnrollment(browser: ReturnType<typeof authBrowser>) {
	const response = await browser.request("two-factor/enable", {
		password: AUTH_PASSWORD,
	});
	return z
		.object({ totpURI: z.string(), backupCodes: z.array(z.string()).min(1) })
		.parse(await jsonOf(response));
}

export async function enrolledAdmin() {
	const fixture = await verifiedAdmin();
	const setup = await startEnrollment(fixture.browser);
	const response = await fixture.browser.request("two-factor/verify-totp", {
		code: totp(setup.totpURI),
	});
	if (!response.ok) {
		throw new Error("테스트 관리자 TOTP 등록 실패");
	}
	return { ...fixture, setup };
}
