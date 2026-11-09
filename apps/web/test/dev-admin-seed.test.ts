import { symmetricDecrypt, verifyPassword } from "better-auth/crypto";
import { describe, expect, it } from "vite-plus/test";

import {
	assertLocalDevelopment,
	base32Encode,
	createDevAdminCredentials,
	devAdminSeedSql,
	parseSeedArgs,
	selectRegistration,
} from "../scripts/dev-admin";
import { totp } from "./totp";

describe("명령줄 인자", () => {
	it("pnpm이 넘기는 앞의 `--`를 무시하고 옵션을 읽는다 (회귀)", () => {
		expect(
			parseSeedArgs([
				"--",
				"--email",
				"admin@example.com",
				"--password",
				"local-dev-password",
			]),
		).toStrictEqual({
			email: "admin@example.com",
			password: "local-dev-password",
		});
	});

	it("`--` 없이도 읽고, 생략한 옵션은 undefined", () => {
		expect(parseSeedArgs(["--email", "admin@example.com"])).toStrictEqual({
			email: "admin@example.com",
			password: undefined,
		});
	});

	it("모르는 옵션은 거절한다", () => {
		expect(() => parseSeedArgs(["--", "--remote"])).toThrow(/remote/u);
	});
});

const LOCAL = {
	siteUrl: "http://localhost:5173",
	nodeEnv: "development",
	persistRoot: null,
};
const AUTH_SECRET = "test-only-auth-secret-0123456789abcdef";
const DIRECTORY = {
	emails: "first@example.com, Second@Example.com",
	phones: "first@example.com=010-1234-5678,second@example.com=01087654321",
};

describe("로컬 전용 가드", () => {
	it("localhost·127.0.0.1의 기본 개발 D1은 통과한다", () => {
		expect(() => assertLocalDevelopment(LOCAL)).not.toThrow();
		expect(() =>
			assertLocalDevelopment({ ...LOCAL, siteUrl: "http://127.0.0.1:3000" }),
		).not.toThrow();
	});

	it("운영 주소는 거절한다", () => {
		expect(() =>
			assertLocalDevelopment({ ...LOCAL, siteUrl: "https://veloss-todo.uk" }),
		).toThrow(/로컬 주소가 아닙니다/u);
	});

	it("NODE_ENV=production은 거절한다", () => {
		expect(() =>
			assertLocalDevelopment({ ...LOCAL, nodeEnv: "production" }),
		).toThrow(/production/u);
	});

	it("E2E/성능 검사용 D1이 선택되어 있으면 거절한다", () => {
		expect(() =>
			assertLocalDevelopment({ ...LOCAL, persistRoot: "/repo/.void/e2e" }),
		).toThrow(/E2E\/성능/u);
	});
});

describe("seed 대상 선택", () => {
	it("이메일이 없으면 허용 목록의 첫 번째를 쓰고 번호는 정규화된 값", () => {
		expect(
			selectRegistration({ ...DIRECTORY, email: undefined }),
		).toStrictEqual({
			email: "first@example.com",
			phoneNumber: "01012345678",
		});
	});

	it("대소문자와 무관하게 지정한 이메일을 고른다", () => {
		expect(
			selectRegistration({ ...DIRECTORY, email: " SECOND@example.com " }),
		).toStrictEqual({
			email: "second@example.com",
			phoneNumber: "01087654321",
		});
	});

	it("허용 목록에 없는 이메일은 거절한다", () => {
		expect(() =>
			selectRegistration({ ...DIRECTORY, email: "other@example.com" }),
		).toThrow(/ADMIN_EMAILS에 없는/u);
	});

	it("등록된 번호가 없으면 ADMIN_PHONES 안내와 함께 거절한다", () => {
		expect(() =>
			selectRegistration({
				emails: "first@example.com",
				phones: "",
				email: undefined,
			}),
		).toThrow(/ADMIN_PHONES/u);
	});
});

describe("자격 증명", () => {
	it("base32는 RFC 6238 테스트 키와 같다", () => {
		expect(base32Encode(new TextEncoder().encode("12345678901234567890"))).toBe(
			"GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
		);
	});

	it("Better Auth가 복호화·검증할 수 있는 형식으로 저장한다", async () => {
		const credentials = await createDevAdminCredentials({
			email: "first@example.com",
			authSecret: AUTH_SECRET,
			password: "local-dev-password-2026",
		});
		const { stored } = credentials;
		await expect(
			verifyPassword({
				hash: stored.passwordHash,
				password: "local-dev-password-2026",
			}),
		).resolves.toBe(true);
		const secret = await symmetricDecrypt({
			key: AUTH_SECRET,
			data: stored.encryptedSecret,
		});
		expect(base32Encode(new TextEncoder().encode(secret))).toBe(
			credentials.setupKey,
		);
		const codes: unknown = JSON.parse(
			await symmetricDecrypt({
				key: AUTH_SECRET,
				data: stored.encryptedBackupCodes,
			}),
		);
		expect(codes).toStrictEqual(credentials.backupCodes);
		expect(credentials.backupCodes).toHaveLength(10);
		expect(totp(credentials.totpUri)).toMatch(/^\d{6}$/u);
	});

	it("비밀번호를 주지 않으면 정책 길이의 무작위 비밀번호를 만든다", async () => {
		const credentials = await createDevAdminCredentials({
			email: "first@example.com",
			authSecret: AUTH_SECRET,
			password: undefined,
		});
		expect(credentials.password.length).toBeGreaterThanOrEqual(10);
	});

	it("정책보다 짧은 비밀번호는 거절한다", async () => {
		await expect(
			createDevAdminCredentials({
				email: "first@example.com",
				authSecret: AUTH_SECRET,
				password: "short",
			}),
		).rejects.toThrow(/비밀번호는/u);
	});
});

describe("seed SQL", () => {
	const sql = devAdminSeedSql({
		email: "o'neil@example.com",
		phoneNumber: "01012345678",
		stored: {
			passwordHash: "hash",
			encryptedSecret: "secret",
			encryptedBackupCodes: "codes",
		},
		now: 1_700_000_000_000,
	});

	it("휴대전화 인증과 2단계 인증을 마친 상태로 넣는다", () => {
		expect(sql).toContain(
			"'o''neil@example.com', 1, '01012345678', 1, 1, 0, 1700000000000",
		);
		expect(sql).toContain("'secret', 'codes', 1, 0);");
	});

	it("같은 이메일/고정 id 계정만 지운다", () => {
		const deletes = sql.split("\n").filter((line) => line.startsWith("DELETE"));
		expect(deletes).toHaveLength(4);
		for (const line of deletes) {
			expect(line).toContain(
				"WHERE email = 'o''neil@example.com' OR id = 'dev-admin'",
			);
		}
	});
});
