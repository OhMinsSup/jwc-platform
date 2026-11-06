import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vite-plus/test";

import {
	AUTH_EMAIL,
	AUTH_PHONE,
	enrolledAdmin,
	jsonOf,
	sessionOf,
	signIn,
} from "./auth-fixture";
import { totp } from "./totp";

const NEW_PASSWORD = "new-test-only-strong-password-2026";

describe("관리자 인증 복구", () => {
	beforeEach(() => {
		vi.useFakeTimers({ toFake: ["Date"] });
		vi.setSystemTime(new Date("2030-01-01T00:00:00Z"));
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it("비밀번호 재설정은 세션을 폐기하고 TOTP를 유지하며 인증번호를 다시 쓸 수 없다", async () => {
		const { browser, sms, phone, setup } = await enrolledAdmin();
		await phone.requestReset({ email: AUTH_EMAIL, phoneNumber: AUTH_PHONE });
		const code = sms.at(-1)?.code;
		if (!code) {
			throw new Error("인증 문자가 없습니다");
		}
		await phone.resetPassword({
			email: AUTH_EMAIL,
			phoneNumber: AUTH_PHONE,
			code,
			password: NEW_PASSWORD,
		});

		await expect(sessionOf(browser)).resolves.toBeNull();
		await expect(
			phone.resetPassword({
				email: AUTH_EMAIL,
				phoneNumber: AUTH_PHONE,
				code,
				password: NEW_PASSWORD,
			}),
		).rejects.toThrow("인증할 수 없습니다");
		await expect(
			jsonOf(await signIn(browser, NEW_PASSWORD)),
		).resolves.toMatchObject({ twoFactorRedirect: true });
		const verified = await browser.request("two-factor/verify-totp", {
			code: totp(setup.totpURI),
		});
		expect(verified.ok).toBe(true);
	});

	it("만료된 2단계 인증 요청에는 올바른 TOTP도 사용할 수 없다", async () => {
		const { browser, setup } = await enrolledAdmin();
		await browser.request("sign-out", {});
		await signIn(browser);
		vi.advanceTimersByTime(11 * 60_000);
		const expired = await browser.request("two-factor/verify-totp", {
			code: totp(setup.totpURI),
		});
		expect(expired.ok).toBe(false);
		await expect(sessionOf(browser)).resolves.toBeNull();
	});
});
