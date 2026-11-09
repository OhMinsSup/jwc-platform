import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vite-plus/test";

import { AUTH_EMAIL, AUTH_PHONE, authFixture, sessionOf } from "./auth-fixture";

const IDENTITY = { email: AUTH_EMAIL, phoneNumber: AUTH_PHONE };

describe("관리자 SMS 인증 계약", () => {
	beforeEach(() => {
		vi.useFakeTimers({ toFake: ["Date"] });
		vi.setSystemTime(new Date("2030-01-01T00:00:00Z"));
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it("관리자 이메일과 다른 번호로는 인증 문자를 발송하지 않는다", async () => {
		const { phone, sms } = authFixture();
		await expect(
			phone.requestCode({ ...IDENTITY, phoneNumber: "01087654321" }),
		).rejects.toThrow("인증할 수 없습니다");
		expect(sms).toHaveLength(0);
	});

	it("6자리 코드는 한 번만 쓸 수 있고 SMS 확인만으로 세션을 만들지 않는다", async () => {
		const { phone, sms, browser } = authFixture();
		await phone.requestCode(IDENTITY);
		const code = sms.at(-1)?.code ?? "";
		expect(code).toMatch(/^\d{6}$/u);
		await expect(
			phone.consumeCode({ ...IDENTITY, code }),
		).resolves.toMatchObject({ status: true });
		await expect(phone.consumeCode({ ...IDENTITY, code })).rejects.toThrow(
			"인증할 수 없습니다",
		);
		await expect(sessionOf(browser)).resolves.toBeNull();
	});

	it("5분이 지난 코드는 거절한다", async () => {
		const { phone, sms } = authFixture();
		await phone.requestCode(IDENTITY);
		const code = sms.at(-1)?.code ?? "";
		vi.advanceTimersByTime(5 * 60_000 + 1);
		await expect(phone.consumeCode({ ...IDENTITY, code })).rejects.toThrow(
			"인증할 수 없습니다",
		);
	});

	it("올바른 코드를 다른 이메일의 가입 확인에 사용할 수 없다", async () => {
		const { phone, sms } = authFixture();
		await phone.requestCode(IDENTITY);
		const code = sms.at(-1)?.code ?? "";
		await expect(
			phone.consumeCode({ ...IDENTITY, email: "other@example.org", code }),
		).rejects.toThrow("인증할 수 없습니다");
		await expect(
			phone.consumeCode({ ...IDENTITY, code }),
		).resolves.toMatchObject({ status: true });
	});

	it("세 번 틀리면 올바른 코드도 다시 발급받아야 한다", async () => {
		const { phone, sms } = authFixture();
		await phone.requestCode(IDENTITY);
		const code = sms.at(-1)?.code ?? "";
		const wrong = code === "000000" ? "000001" : "000000";
		for (let attempt = 0; attempt < 3; attempt += 1) {
			// oxlint-disable-next-line no-await-in-loop -- 실패 횟수 누적을 검증하므로 순차 실행한다
			await expect(
				phone.consumeCode({ ...IDENTITY, code: wrong }),
			).rejects.toThrow("인증할 수 없습니다");
		}
		await expect(phone.consumeCode({ ...IDENTITY, code })).rejects.toThrow(
			"인증할 수 없습니다",
		);
	});

	it("동시에 확인해도 한 요청만 코드를 소비한다", async () => {
		const { phone, sms } = authFixture();
		await phone.requestCode(IDENTITY);
		const code = sms.at(-1)?.code ?? "";
		const results = await Promise.allSettled([
			phone.consumeCode({ ...IDENTITY, code }),
			phone.consumeCode({ ...IDENTITY, code }),
		]);
		expect(
			results.filter((result) => result.status === "fulfilled"),
		).toHaveLength(1);
	});

	it("유효한 SMS 코드가 있어도 공개 전화번호 API로 TOTP를 우회할 수 없다", async () => {
		const { phone, sms, browser } = authFixture();
		await phone.requestCode(IDENTITY);
		const code = sms.at(-1)?.code ?? "";
		const response = await browser.request("phone-number/verify", {
			phoneNumber: AUTH_PHONE,
			code,
		});
		expect(response.status).toBe(403);
		await expect(sessionOf(browser)).resolves.toBeNull();
	});

	it("가입 확인 코드를 비밀번호 재설정에 사용할 수 없다", async () => {
		const { phone, sms } = authFixture();
		await phone.requestCode(IDENTITY);
		const code = sms.at(-1)?.code ?? "";
		await expect(
			phone.resetPassword({
				...IDENTITY,
				code,
				password: "different-password-2026",
			}),
		).rejects.toThrow("인증할 수 없습니다");
	});
});
