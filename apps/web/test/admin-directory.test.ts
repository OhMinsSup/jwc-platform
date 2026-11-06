import { describe, expect, it } from "vite-plus/test";

import { parseAdminDirectory } from "../src/features/admin-access/domain/admin-directory";

const EMAIL = "admin@example.org";

describe(parseAdminDirectory, () => {
	it("이메일과 국내 번호를 정규화해 관리자 등록 정보로 묶는다", () => {
		const directory = parseAdminDirectory({
			emails: " ADMIN@example.org ",
			phones: " ADMIN@example.org=+82 10-1234-5678 ",
		});
		expect(directory.get(EMAIL)).toStrictEqual({
			email: EMAIL,
			phoneNumber: "01012345678",
		});
	});

	it("번호만 지정해도 이메일 허용 목록에 없으면 관리자가 아니다", () => {
		const directory = parseAdminDirectory({
			emails: "",
			phones: `${EMAIL}=01012345678`,
		});
		expect(directory.has(EMAIL)).toBe(false);
	});

	it("허용 목록에 있어도 번호가 없다는 사실을 유지한다", () => {
		const directory = parseAdminDirectory({ emails: EMAIL, phones: "" });
		expect(directory.get(EMAIL)).toStrictEqual({
			email: EMAIL,
			phoneNumber: null,
		});
	});

	it("비어 있는 설정은 아무 관리자도 허용하지 않는다", () => {
		expect(parseAdminDirectory({ emails: "", phones: "" }).size).toBe(0);
	});

	it.each([
		"invalid",
		`${EMAIL}=123`,
		`${EMAIL}=01012345678,other@example.org=01012345678`,
		`${EMAIL}=01012345678,${EMAIL}=01087654321`,
	])("잘못되거나 중복된 번호 연결을 거절한다: %s", (phones) => {
		expect(() => parseAdminDirectory({ emails: EMAIL, phones })).toThrow(
			"ADMIN_PHONES",
		);
	});

	it("잘못된 이메일 설정은 값 자체를 오류에 포함하지 않는다", () => {
		expect(() =>
			parseAdminDirectory({ emails: "private-invalid-address", phones: "" }),
		).toThrow("ADMIN_EMAILS는 올바른 이메일을 쉼표로 구분해 설정해주세요");
	});
});
