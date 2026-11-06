import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import type { env as RuntimeEnv } from "void/env";

import { decideAdminAccess } from "../src/features/admin-access/domain/admin-auth-state";
import { parseAdminDirectory } from "../src/features/admin-access/domain/admin-directory";
import { phoneOperations } from "../src/features/admin-access/server/phone-operations";
import {
	authRuntimeConfig,
	authSmsSender,
} from "../src/platform/server/runtime";
import { AUTH_EMAIL, AUTH_PHONE, authFixture } from "./auth-fixture";

const { settings, setSmsMode } = vi.hoisted(() => {
	let mode: "live" | "log" = "log";
	const testEnvironment = {
		SITE_URL: "https://forms.example.org",
		BETTER_AUTH_SECRET: "test-only-auth-secret-longer-than-32-characters",
		ADMIN_EMAILS: "admin@example.org",
		ADMIN_PHONES: "admin@example.org=01012345678",
		DATA_KEY: "test-only-unused",
		GOOGLE_SERVICE_ACCOUNT_EMAIL: "test@example.org",
		GOOGLE_PRIVATE_KEY: "unused",
		GOOGLE_SPREADSHEET_ID: "unused",
		SUBMISSION_STORE: "memory",
		get SMS_MODE() {
			return mode;
		},
		SOLAPI_API_KEY: "",
		SOLAPI_API_SECRET: "",
		SOLAPI_SENDER: "",
		POSTHOG_KEY: undefined,
		POSTHOG_HOST: "https://us.i.posthog.com",
		TURNSTILE_SITE_KEY: undefined,
		TURNSTILE_SECRET_KEY: undefined,
		ADMIN_SIGNUP_ENABLED: true,
	} satisfies typeof RuntimeEnv;
	return {
		settings: testEnvironment,
		setSmsMode: (next: "live" | "log") => {
			mode = next;
		},
	};
});
vi.mock(import("void/env"), () => ({ env: settings }));

describe(authSmsSender, () => {
	beforeEach(() => {
		setSmsMode("log");
	});

	it("로그 모드의 가짜 발송 성공을 인증 문자 발송으로 사용하지 않는다", () => {
		expect(() => authSmsSender()).toThrow("실제 SMS 발송 설정이 필요합니다");
	});

	it("실제 발송 모드여도 Solapi 설정이 없으면 거절한다", () => {
		setSmsMode("live");
		expect(() => authSmsSender()).toThrow(
			"SOLAPI_API_KEY / SOLAPI_API_SECRET / SOLAPI_SENDER",
		);
	});
});

function directory() {
	const config = authRuntimeConfig();
	return parseAdminDirectory({
		emails: config.adminEmails,
		phones: config.adminPhones,
	});
}

describe("관리자 인증 환경 설정", () => {
	beforeEach(() => {
		settings.ADMIN_EMAILS = AUTH_EMAIL;
		settings.ADMIN_PHONES = `${AUTH_EMAIL}=${AUTH_PHONE}`;
	});

	it("번호 설정이 누락되면 빈 번호 목록으로 처리한다", () => {
		Reflect.deleteProperty(settings, "ADMIN_PHONES");
		expect(authRuntimeConfig().adminPhones).toBe("");
		expect(directory().get(AUTH_EMAIL)?.phoneNumber).toBeNull();
	});

	it("이메일 설정이 누락되면 관리자를 허용하지 않는다", () => {
		Reflect.deleteProperty(settings, "ADMIN_EMAILS");
		expect(authRuntimeConfig().adminEmails).toBe("");
		expect(directory().size).toBe(0);
	});

	it.each(["", "   "])("빈 번호 목록을 안전하게 처리한다: %j", (value) => {
		settings.ADMIN_PHONES = value;
		expect(directory().get(AUTH_EMAIL)?.phoneNumber).toBeNull();
	});

	it.each(["ADMIN_EMAILS", "ADMIN_PHONES"])(
		"%s 누락 시 접근 상태 조회는 가능하고 SMS는 발송하지 않는다",
		async (key) => {
			Reflect.deleteProperty(settings, key);
			const { auth, sms } = authFixture();
			const registration = directory().get(AUTH_EMAIL) ?? null;
			expect(decideAdminAccess({ user: null, registration })).toStrictEqual({
				kind: "signed_out",
			});
			expect(
				decideAdminAccess({
					user: {
						id: "test-admin",
						name: "관리자",
						email: AUTH_EMAIL,
						phoneNumber: AUTH_PHONE,
						phoneNumberVerified: true,
						twoFactorEnabled: true,
					},
					registration,
				}).kind,
			).not.toBe("ready");
			const phone = phoneOperations(
				auth,
				() => registration?.phoneNumber ?? null,
			);
			await expect(
				phone.requestCode({ email: AUTH_EMAIL, phoneNumber: AUTH_PHONE }),
			).rejects.toThrow("인증할 수 없습니다");
			expect(sms).toHaveLength(0);
		},
	);

	it("등록된 이메일과 번호 연결은 유지한다", () => {
		expect(directory().get(AUTH_EMAIL)).toStrictEqual({
			email: AUTH_EMAIL,
			phoneNumber: AUTH_PHONE,
		});
	});
});
