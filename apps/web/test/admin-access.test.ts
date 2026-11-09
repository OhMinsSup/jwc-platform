import { deriveDataKeys, hmacHex } from "@jwc/common/crypto";
import { bytesToBase64 } from "@jwc/common/encoding";
import { describe, expect, it } from "vite-plus/test";

import {
	decideSignupPath,
	inviteStatus,
	normalizeEmail,
} from "../src/features/admin-access/domain/admin-signup";
import type { SignupFacts } from "../src/features/admin-access/domain/admin-signup";
import {
	generateInviteCode,
	inviteCodeHash,
	isInviteCodeShape,
} from "../src/features/admin-access/server/invite-code";

const MASTER = bytesToBase64(new Uint8Array(32).fill(7));
const OTHER = bytesToBase64(new Uint8Array(32).fill(9));
const URL_SAFE = /^[A-Za-z0-9_-]+$/u;

/** 기본: 허용 목록에 있고, 코드 없음, 부트스트랩 켜짐, 계정 없음 */
function facts(overrides: Partial<SignupFacts> = {}): SignupFacts {
	return {
		allowlisted: true,
		hasInviteCode: false,
		bootstrapEnabled: true,
		existingUsers: 0,
		...overrides,
	};
}

describe(decideSignupPath, () => {
	it("허용 목록에 없으면 코드/부트스트랩과 관계없이 거절", () => {
		expect(
			decideSignupPath(facts({ allowlisted: false, hasInviteCode: true })),
		).toStrictEqual({ kind: "reject", reason: "not_allowlisted" });
		expect(decideSignupPath(facts({ allowlisted: false }))).toStrictEqual({
			kind: "reject",
			reason: "not_allowlisted",
		});
	});

	it("코드가 있으면 초대 경로 (계정 수/부트스트랩 설정과 무관)", () => {
		expect(
			decideSignupPath(
				facts({
					hasInviteCode: true,
					bootstrapEnabled: false,
					existingUsers: 3,
				}),
			),
		).toStrictEqual({ kind: "invite" });
	});

	it("코드 없이 첫 관리자: 설정이 켜져 있고 계정이 0개일 때만 부트스트랩", () => {
		expect(decideSignupPath(facts())).toStrictEqual({ kind: "bootstrap" });
	});

	it("부트스트랩 설정이 꺼져 있으면 계정이 없어도 거절", () => {
		expect(decideSignupPath(facts({ bootstrapEnabled: false }))).toStrictEqual({
			kind: "reject",
			reason: "bootstrap_closed",
		});
	});

	it("이미 계정이 있으면 코드가 필요하다", () => {
		expect(decideSignupPath(facts({ existingUsers: 1 }))).toStrictEqual({
			kind: "reject",
			reason: "invite_required",
		});
	});
});

describe(inviteStatus, () => {
	const now = 1_000_000;

	it("만료 전 미사용은 대기", () => {
		expect(inviteStatus({ expiresAt: now + 1, usedAt: null }, now)).toBe(
			"pending",
		);
	});

	it("만료 시각과 같거나 지나면 만료 (claim 조건 expires_at > now와 같은 경계)", () => {
		expect(inviteStatus({ expiresAt: now, usedAt: null }, now)).toBe("expired");
		expect(inviteStatus({ expiresAt: now - 1, usedAt: null }, now)).toBe(
			"expired",
		);
	});

	it("사용된 초대는 만료 뒤에도 사용으로 보인다", () => {
		expect(inviteStatus({ expiresAt: now - 1, usedAt: now - 10 }, now)).toBe(
			"used",
		);
	});
});

describe(normalizeEmail, () => {
	it("앞뒤 공백 제거 + 소문자", () => {
		expect(normalizeEmail("  Admin@Example.ORG ")).toBe("admin@example.org");
	});
});

describe(generateInviteCode, () => {
	it("24자 URL 안전 문자열 (144비트), 형식 검사를 통과한다", () => {
		const code = generateInviteCode();
		expect(code).toHaveLength(24);
		expect(URL_SAFE.test(code)).toBe(true);
		expect(isInviteCodeShape(code)).toBe(true);
	});

	it("매번 다르다 (충돌 없음)", () => {
		const codes = new Set(
			Array.from({ length: 1000 }, () => generateInviteCode()),
		);
		expect(codes.size).toBe(1000);
	});
});

describe(isInviteCodeShape, () => {
	it("길이/문자가 다르면 거절 (DB 조회 전에 걸러낸다)", () => {
		expect(isInviteCodeShape("")).toBe(false);
		expect(isInviteCodeShape("a".repeat(23))).toBe(false);
		expect(isInviteCodeShape("a".repeat(25))).toBe(false);
		expect(isInviteCodeShape(`${"a".repeat(23)}=`)).toBe(false);
		expect(isInviteCodeShape(`${"a".repeat(23)}+`)).toBe(false);
	});
});

describe(inviteCodeHash, () => {
	it("저장값은 코드와 다르고, 같은 키/코드면 같은 값 (조회 가능)", async () => {
		const keys = await deriveDataKeys(MASTER);
		const code = generateInviteCode();
		const hash = await inviteCodeHash(keys.identity, code);
		expect(hash).not.toBe(code);
		expect(hash).not.toContain(code);
		expect(hash).toMatch(/^[0-9a-f]{64}$/u);
		await expect(inviteCodeHash(keys.identity, code)).resolves.toBe(hash);
	});

	it("다른 키, 다른 용도(접두사 없는 HMAC)와는 값이 다르다", async () => {
		const keys = await deriveDataKeys(MASTER);
		const otherKeys = await deriveDataKeys(OTHER);
		const code = generateInviteCode();
		const hash = await inviteCodeHash(keys.identity, code);
		await expect(inviteCodeHash(otherKeys.identity, code)).resolves.not.toBe(
			hash,
		);
		await expect(hmacHex(keys.identity, code)).resolves.not.toBe(hash);
	});
});
