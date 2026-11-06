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
	AUTH_PASSWORD,
	authBrowser,
	authFixture,
	enrolledAdmin,
	jsonOf,
	registerAdmin,
	sessionOf,
	signIn,
	startEnrollment,
	verifiedAdmin,
} from "./auth-fixture";
import { totp } from "./totp";

describe("관리자 인증 HTTP 계약", () => {
	beforeEach(() => {
		vi.useFakeTimers({ toFake: ["Date"] });
		vi.setSystemTime(new Date("2030-01-01T00:00:00Z"));
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it("승인 범위 없는 공개 가입은 계정을 만들거나 문자를 보내지 않는다", async () => {
		const { browser, sms } = authFixture();
		await browser.request("sign-up/email", {
			email: AUTH_EMAIL,
			name: "관리자",
			password: AUTH_PASSWORD,
		});
		const login = await signIn(browser);
		expect(login.status).toBe(401);
		expect(sms).toHaveLength(0);
		await expect(sessionOf(browser)).resolves.toBeNull();
	});

	it("SMS 인증 후 가입해도 자동 로그인하지 않는다", async () => {
		const fixture = authFixture();
		const registered = await registerAdmin(fixture);
		expect(registered.path).toBe("bootstrap");
		expect(registered.userId).toBeTruthy();
		await expect(sessionOf(fixture.browser)).resolves.toBeNull();
		const login = await signIn(fixture.browser);
		expect(login.ok).toBe(true);
		await expect(sessionOf(fixture.browser)).resolves.toMatchObject({
			user: {
				phoneNumberVerified: true,
				emailVerified: false,
				twoFactorEnabled: false,
			},
		});
	});

	it("TOTP를 확인해야 등록이 완료되고 등록 전 세션은 폐기된다", async () => {
		const { auth, browser } = await verifiedAdmin();
		const stale = authBrowser(auth);
		await signIn(stale);
		const setup = await startEnrollment(browser);
		const invalid = await browser.request("two-factor/verify-totp", {
			code: "invalid",
		});
		expect(invalid.ok).toBe(false);
		await expect(sessionOf(browser)).resolves.toMatchObject({
			user: { twoFactorEnabled: false },
		});
		const verified = await browser.request("two-factor/verify-totp", {
			code: totp(setup.totpURI),
		});
		expect(verified.ok).toBe(true);
		await expect(sessionOf(browser)).resolves.toMatchObject({
			user: { phoneNumberVerified: true, twoFactorEnabled: true },
		});
		await expect(sessionOf(stale)).resolves.toBeNull();
	});

	it("다음 로그인은 비밀번호만으로 세션을 발급하지 않는다", async () => {
		const { browser, setup } = await enrolledAdmin();
		await browser.request("sign-out", {});
		await expect(jsonOf(await signIn(browser))).resolves.toMatchObject({
			twoFactorRedirect: true,
		});
		await expect(sessionOf(browser)).resolves.toBeNull();
		const invalid = await browser.request("two-factor/verify-totp", {
			code: "invalid",
		});
		expect(invalid.ok).toBe(false);
		const verified = await browser.request("two-factor/verify-totp", {
			code: totp(setup.totpURI),
		});
		expect(verified.ok).toBe(true);
		await expect(sessionOf(browser)).resolves.toMatchObject({
			user: { twoFactorEnabled: true },
		});
	});

	it("복구 코드는 로그인에 한 번만 쓸 수 있다", async () => {
		const { browser, setup } = await enrolledAdmin();
		await browser.request("sign-out", {});
		await signIn(browser);
		const recovered = await browser.request("two-factor/verify-backup-code", {
			code: setup.backupCodes[0],
		});
		expect(recovered.ok).toBe(true);
		await browser.request("sign-out", {});
		await signIn(browser);
		const reused = await browser.request("two-factor/verify-backup-code", {
			code: setup.backupCodes[0],
		});
		expect(reused.ok).toBe(false);
		await expect(sessionOf(browser)).resolves.toBeNull();
	});

	it("비밀번호를 알아도 필수 TOTP를 해제할 수 없다", async () => {
		const { browser } = await enrolledAdmin();
		const response = await browser.request("two-factor/disable", {
			password: AUTH_PASSWORD,
		});
		expect(response.status).toBe(403);
		await expect(sessionOf(browser)).resolves.toMatchObject({
			user: { twoFactorEnabled: true },
		});
	});
});
