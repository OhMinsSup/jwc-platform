import { parseArgs } from "node:util";

import {
	generateRandomString,
	hashPassword,
	symmetricEncrypt,
} from "better-auth/crypto";

import { ADMIN_AUTH_POLICY } from "../src/features/admin-access/domain/admin-auth-policy";
import { parseAdminDirectory } from "../src/features/admin-access/domain/admin-directory";
import { normalizeEmail } from "../src/features/admin-access/domain/admin-signup";

/**
 * 로컬 개발용 관리자 seed (순수 판단 + 자격 증명 준비).
 * I/O(env 읽기, 파일, void CLI)는 seed-dev-admin.ts가 맡는다.
 */

const DEV_ADMIN = {
	id: "dev-admin",
	accountId: "dev-admin-account",
	twoFactorId: "dev-admin-two-factor",
	name: "로컬 개발 관리자",
	issuer: "JWC 신청서",
} as const;

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const TOTP_SECRET_LENGTH = 32;
const BACKUP_CODE = { amount: 10, length: 10, split: 5 } as const;
const GENERATED_PASSWORD_LENGTH = 24;
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const BASE32_BITS = 5;
const BYTE_BITS = 8;

const END_OF_OPTIONS = "--";

/**
 * `pnpm <script> -- --email ...`은 `--`까지 그대로 넘긴다. parseArgs는 `--` 뒤를
 * 위치 인자로 보므로 맨 앞의 `--` 하나만 떼고 읽는다. 모르는 옵션은 parseArgs가 거절한다.
 */
export function parseSeedArgs(argv: readonly string[]): {
	email: string | undefined;
	password: string | undefined;
} {
	const args = argv[0] === END_OF_OPTIONS ? argv.slice(1) : [...argv];
	const { values } = parseArgs({
		args,
		options: { email: { type: "string" }, password: { type: "string" } },
	});
	return { email: values.email, password: values.password };
}

export interface LocalGuardFacts {
	siteUrl: string;
	nodeEnv: string | undefined;
	/** .void/local-d1.json의 persistRoot. 없으면 기본 개발 D1 */
	persistRoot: string | null;
}

/** 로컬 개발 D1·로컬 주소일 때만 통과한다. 아니면 이유를 담아 던진다 */
export function assertLocalDevelopment(facts: LocalGuardFacts): void {
	if (facts.nodeEnv === "production") {
		throw new Error("NODE_ENV=production에서는 실행할 수 없습니다");
	}
	const { hostname } = new URL(facts.siteUrl);
	if (!LOCAL_HOSTS.has(hostname)) {
		throw new Error(
			`SITE_URL이 로컬 주소가 아닙니다(${hostname}). 로컬 개발 설정에서만 실행합니다`,
		);
	}
	if (facts.persistRoot !== null) {
		throw new Error(
			`E2E/성능 검사용 D1(${facts.persistRoot})이 선택되어 있습니다. 해당 서버를 끄고 .void/local-d1.json을 지운 뒤 다시 실행하세요`,
		);
	}
}

/** 허용 목록(ADMIN_EMAILS/ADMIN_PHONES)에서 seed할 관리자를 고른다. 이메일을 안 주면 첫 번째 */
export function selectRegistration(config: {
	emails: string;
	phones: string;
	email: string | undefined;
}): { email: string; phoneNumber: string } {
	const directory = parseAdminDirectory(config);
	const email = config.email
		? normalizeEmail(config.email)
		: [...directory.keys()][0];
	const registration = email ? directory.get(email) : undefined;
	if (!registration) {
		throw new Error(
			`ADMIN_EMAILS에 없는 이메일입니다: ${email ?? "(비어 있음)"}`,
		);
	}
	if (!registration.phoneNumber) {
		throw new Error(
			`ADMIN_PHONES에 ${registration.email}=휴대전화번호 를 추가해주세요`,
		);
	}
	return { email: registration.email, phoneNumber: registration.phoneNumber };
}

function assertPasswordPolicy(password: string): void {
	const { minLength, maxLength } = ADMIN_AUTH_POLICY.password;
	if (password.length < minLength || password.length > maxLength) {
		throw new Error(`비밀번호는 ${minLength}~${maxLength}자여야 합니다`);
	}
}

/** RFC 4648 base32 (패딩 없음). 인증 앱 설정 키 표시용 */
export function base32Encode(bytes: Uint8Array): string {
	let bits = "";
	for (const byte of bytes) {
		bits += byte.toString(2).padStart(BYTE_BITS, "0");
	}
	let output = "";
	for (let index = 0; index < bits.length; index += BASE32_BITS) {
		const chunk = bits
			.slice(index, index + BASE32_BITS)
			.padEnd(BASE32_BITS, "0");
		output += BASE32_ALPHABET[Number.parseInt(chunk, 2)];
	}
	return output;
}

export interface DevAdminCredentials {
	password: string;
	setupKey: string;
	totpUri: string;
	backupCodes: string[];
	stored: {
		passwordHash: string;
		encryptedSecret: string;
		encryptedBackupCodes: string;
	};
}

function generateBackupCodes(): string[] {
	return Array.from({ length: BACKUP_CODE.amount }, () => {
		const code = generateRandomString(BACKUP_CODE.length, "a-z", "0-9", "A-Z");
		return `${code.slice(0, BACKUP_CODE.split)}-${code.slice(BACKUP_CODE.split)}`;
	});
}

/**
 * Better Auth two-factor 플러그인과 같은 형식으로 만든다:
 * TOTP 비밀값 원문 문자열과 복구 코드 JSON을 BETTER_AUTH_SECRET으로 symmetricEncrypt.
 */
export async function createDevAdminCredentials(input: {
	email: string;
	authSecret: string;
	password: string | undefined;
}): Promise<DevAdminCredentials> {
	const password =
		input.password ?? generateRandomString(GENERATED_PASSWORD_LENGTH);
	assertPasswordPolicy(password);
	const secret = generateRandomString(TOTP_SECRET_LENGTH);
	const setupKey = base32Encode(new TextEncoder().encode(secret));
	const backupCodes = generateBackupCodes();
	const label = encodeURIComponent(`${DEV_ADMIN.issuer}:${input.email}`);
	const totpUri = `otpauth://totp/${label}?secret=${setupKey}&issuer=${encodeURIComponent(DEV_ADMIN.issuer)}&digits=${ADMIN_AUTH_POLICY.totp.codeLength}&period=30`;
	return {
		password,
		setupKey,
		totpUri,
		backupCodes,
		stored: {
			passwordHash: await hashPassword(password),
			encryptedSecret: await symmetricEncrypt({
				key: input.authSecret,
				data: secret,
			}),
			encryptedBackupCodes: await symmetricEncrypt({
				key: input.authSecret,
				data: JSON.stringify(backupCodes),
			}),
		},
	};
}

/** SQL 문자열 리터럴 (작은따옴표 두 번) */
const sqlText = (value: string) => `'${value.replaceAll("'", "''")}'`;

/**
 * 같은 이메일/고정 id의 계정을 지우고(세션·2FA·계정은 FK cascade + 명시 삭제)
 * 휴대전화 인증과 TOTP 등록을 마친 상태로 다시 넣는다. 다른 데이터는 건드리지 않는다.
 */
export function devAdminSeedSql(input: {
	email: string;
	phoneNumber: string;
	stored: DevAdminCredentials["stored"];
	now: number;
}): string {
	const { email, phoneNumber, stored, now } = input;
	const userId = sqlText(DEV_ADMIN.id);
	const owners = `SELECT id FROM user WHERE email = ${sqlText(email)} OR id = ${userId}`;
	return [
		`DELETE FROM session WHERE user_id IN (${owners});`,
		`DELETE FROM two_factor WHERE user_id IN (${owners});`,
		`DELETE FROM account WHERE user_id IN (${owners});`,
		`DELETE FROM user WHERE id IN (${owners});`,
		`INSERT INTO user (id, name, email, email_verified, phone_number, phone_number_verified, two_factor_enabled, bootstrap_admin, created_at, updated_at) VALUES (${userId}, ${sqlText(DEV_ADMIN.name)}, ${sqlText(email)}, 1, ${sqlText(phoneNumber)}, 1, 1, 0, ${now}, ${now});`,
		`INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at) VALUES (${sqlText(DEV_ADMIN.accountId)}, ${userId}, 'credential', ${userId}, ${sqlText(stored.passwordHash)}, ${now}, ${now});`,
		`INSERT INTO two_factor (id, user_id, secret, backup_codes, verified, failed_verification_count) VALUES (${sqlText(DEV_ADMIN.twoFactorId)}, ${userId}, ${sqlText(stored.encryptedSecret)}, ${sqlText(stored.encryptedBackupCodes)}, 1, 0);`,
	].join("\n");
}
