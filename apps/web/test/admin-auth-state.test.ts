import { describe, expect, it } from "vite-plus/test";

import { decideAdminAccess } from "../src/features/admin-access/domain/admin-auth-state";

const REGISTRATION = { email: "admin@example.org", phoneNumber: "01012345678" };
const USER = {
	id: "test-admin",
	name: "테스트 관리자",
	email: REGISTRATION.email,
	phoneNumber: REGISTRATION.phoneNumber,
	phoneNumberVerified: true,
	twoFactorEnabled: true,
};

describe(decideAdminAccess, () => {
	it("세션이 없으면 미로그인이며 등록되지 않은 사용자는 차단한다", () => {
		expect(
			decideAdminAccess({ user: null, registration: REGISTRATION }),
		).toStrictEqual({ kind: "signed_out" });
		expect(decideAdminAccess({ user: USER, registration: null })).toStrictEqual(
			{ kind: "blocked" },
		);
	});

	it("다른 관리자의 등록 정보로는 권한을 부여하지 않는다", () => {
		expect(
			decideAdminAccess({
				user: USER,
				registration: { ...REGISTRATION, email: "other@example.org" },
			}),
		).toStrictEqual({ kind: "blocked" });
	});

	it.each([
		{
			user: { ...USER, phoneNumberVerified: false },
			registration: REGISTRATION,
		},
		{
			user: USER,
			registration: { ...REGISTRATION, phoneNumber: "01087654321" },
		},
		{ user: USER, registration: { ...REGISTRATION, phoneNumber: null } },
	])("미인증·번호 변경·번호 누락은 SMS 확인이 필요하다", (facts) => {
		expect(decideAdminAccess(facts)).toStrictEqual({ kind: "verify_phone" });
	});

	it("SMS 확인 후에도 TOTP를 등록해야 관리자다", () => {
		expect(
			decideAdminAccess({
				user: { ...USER, twoFactorEnabled: false },
				registration: REGISTRATION,
			}),
		).toStrictEqual({ kind: "setup_two_factor" });
	});

	it("준비된 관리자는 화면에 필요한 식별 정보만 반환한다", () => {
		expect(
			decideAdminAccess({ user: USER, registration: REGISTRATION }),
		).toStrictEqual({
			kind: "ready",
			admin: { id: USER.id, email: USER.email, name: USER.name },
		});
	});
});
