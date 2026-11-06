import { describe, expect, it } from "vite-plus/test";

import {
	AUTH_EMAIL,
	AUTH_PASSWORD,
	AUTH_PHONE,
	SECOND_ADMIN,
	authFixture,
	registerAdmin,
	signIn,
} from "./auth-fixture";

const INVITE = "a".repeat(24);

async function signupInput(fixture: ReturnType<typeof authFixture>) {
	await fixture.phone.requestCode({
		email: AUTH_EMAIL,
		phoneNumber: AUTH_PHONE,
	});
	return {
		email: AUTH_EMAIL,
		phoneNumber: AUTH_PHONE,
		name: "가입 테스트",
		password: AUTH_PASSWORD,
		code: fixture.sms.at(-1)?.code ?? "",
	};
}

function invite(fixture: ReturnType<typeof authFixture>, email = AUTH_EMAIL) {
	return fixture.invites.addInvite({
		email,
		codeHash: `test-hash:${INVITE}`,
		expiresAt: Date.now() + 60_000,
	});
}

describe("관리자 가입 모듈", () => {
	it("첫 관리자는 초대 없이 SMS 확인 후 가입하고 비밀번호로 로그인할 수 있다", async () => {
		const fixture = authFixture();
		const result = await registerAdmin(fixture);
		expect(result).toMatchObject({ path: "bootstrap", inviteId: null });
		const login = await signIn(fixture.browser);
		expect(login.ok).toBe(true);
	});

	it("최초 가입을 막은 환경에서도 올바른 초대는 사용할 수 있다", async () => {
		const fixture = authFixture(false);
		const input = await signupInput(fixture);
		const inviteId = invite(fixture);
		await expect(
			fixture.signup(
				{ ...input, inviteCode: INVITE },
				new Headers(),
				Date.now(),
			),
		).resolves.toMatchObject({ path: "invite", inviteId });
	});

	it("초대가 틀렸다고 최초 가입으로 넘어가지 않고 SMS 코드도 소비하지 않는다", async () => {
		const fixture = authFixture();
		const input = await signupInput(fixture);
		await expect(
			fixture.signup(
				{ ...input, inviteCode: INVITE },
				new Headers(),
				Date.now(),
			),
		).rejects.toThrow("가입할 수 없습니다");
		await expect(
			fixture.signup(input, new Headers(), Date.now()),
		).resolves.toMatchObject({ path: "bootstrap" });
	});

	it("잘못된 SMS로 실패한 초대는 올바른 코드로 다시 사용할 수 있다", async () => {
		const fixture = authFixture(false);
		const input = await signupInput(fixture);
		const inviteId = invite(fixture);
		const wrong = input.code === "000000" ? "000001" : "000000";
		await expect(
			fixture.signup(
				{ ...input, code: wrong, inviteCode: INVITE },
				new Headers(),
				Date.now(),
			),
		).rejects.toThrow("인증할 수 없습니다");
		await expect(
			fixture.signup(
				{ ...input, inviteCode: INVITE },
				new Headers(),
				Date.now(),
			),
		).resolves.toMatchObject({ inviteId });
	});

	it("계정 생성이 실패해도 초대를 돌려주며 이미 소비한 SMS는 새로 발급받는다", async () => {
		const fixture = authFixture(false);
		const input = await signupInput(fixture);
		const inviteId = invite(fixture);
		await expect(
			fixture.signup(
				{ ...input, password: "short", inviteCode: INVITE },
				new Headers(),
				Date.now(),
			),
		).rejects.toThrow("가입할 수 없습니다");
		await expect(
			fixture.signup(
				{ ...input, inviteCode: INVITE },
				new Headers(),
				Date.now(),
			),
		).rejects.toThrow("인증할 수 없습니다");
		const next = await signupInput(fixture);
		await expect(
			fixture.signup(
				{ ...next, inviteCode: INVITE },
				new Headers(),
				Date.now(),
			),
		).resolves.toMatchObject({ inviteId });
	});

	it("다른 이메일에 묶인 초대는 사용할 수 없다", async () => {
		const fixture = authFixture(false);
		const input = await signupInput(fixture);
		invite(fixture, "other@example.org");
		await expect(
			fixture.signup(
				{ ...input, inviteCode: INVITE },
				new Headers(),
				Date.now(),
			),
		).rejects.toThrow("가입할 수 없습니다");
	});

	it("이미 계정이 있으면 초대 없는 가입을 거절한다", async () => {
		const fixture = authFixture();
		await registerAdmin(fixture);
		const input = await signupInput(fixture);
		await expect(
			fixture.signup(input, new Headers(), Date.now()),
		).rejects.toThrow("가입할 수 없습니다");
	});

	it("기존 관리자가 있어도 다른 관리자는 자기 번호와 초대로 가입한다", async () => {
		const fixture = authFixture();
		await registerAdmin(fixture);
		const inviteId = invite(fixture, SECOND_ADMIN.email);
		await fixture.phone.requestCode(SECOND_ADMIN);
		const result = await fixture.signup(
			{
				...SECOND_ADMIN,
				name: "두 번째 관리자",
				password: AUTH_PASSWORD,
				code: fixture.sms.at(-1)?.code ?? "",
				inviteCode: INVITE,
			},
			new Headers(),
			Date.now(),
		);
		expect(result).toMatchObject({ path: "invite", inviteId });
		const login = await fixture.browser.request("sign-in/email", {
			email: SECOND_ADMIN.email,
			password: AUTH_PASSWORD,
		});
		expect(login.ok).toBe(true);
	});

	it("동일한 초대의 동시 가입은 한 요청만 성공한다", async () => {
		const fixture = authFixture(false);
		const input = { ...(await signupInput(fixture)), inviteCode: INVITE };
		invite(fixture);
		const results = await Promise.allSettled([
			fixture.signup(input, new Headers(), Date.now()),
			fixture.signup(input, new Headers(), Date.now()),
		]);
		expect(
			results.filter((result) => result.status === "fulfilled"),
		).toHaveLength(1);
		const login = await signIn(fixture.browser);
		expect(login.ok).toBe(true);
	});
});
