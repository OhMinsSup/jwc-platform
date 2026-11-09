import { execFileSync } from "node:child_process";
import {
	existsSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { z } from "zod";

import {
	assertLocalDevelopment,
	createDevAdminCredentials,
	devAdminSeedSql,
	parseSeedArgs,
	selectRegistration,
} from "./dev-admin";
import type { DevAdminCredentials } from "./dev-admin";

/**
 * 로컬 개발 D1에 "모든 인증을 마친" 관리자 한 명을 넣는다 (휴대전화 인증 완료 + TOTP 등록 완료).
 *
 *   pnpm -C apps/web db:seed-admin                     # ADMIN_EMAILS의 첫 번째 이메일
 *   pnpm -C apps/web db:seed-admin -- --email a@b.com  # 특정 이메일
 *   pnpm -C apps/web db:seed-admin -- --password <비밀번호>  # 비밀번호 지정 (없으면 무작위 생성)
 *
 * 로컬 전용: SITE_URL이 localhost가 아니거나, NODE_ENV=production이거나, E2E/성능 D1이 선택되어 있으면 멈춘다.
 * void db 명령에는 --remote를 절대 넘기지 않는다.
 */

const LOCAL_D1_STATE = ".void/local-d1.json";
const EnvSchema = z.object({
	SITE_URL: z.url(),
	BETTER_AUTH_SECRET: z.string().min(1),
	ADMIN_EMAILS: z.string().min(1),
	ADMIN_PHONES: z.string().default(""),
	NODE_ENV: z.string().optional(),
});

function readPersistRoot(): string | null {
	if (!existsSync(LOCAL_D1_STATE)) {
		return null;
	}
	const state: unknown = JSON.parse(readFileSync(LOCAL_D1_STATE, "utf-8"));
	return z.object({ persistRoot: z.string() }).parse(state).persistRoot;
}

function executeLocalSql(sql: string): void {
	const directory = mkdtempSync(path.join(tmpdir(), "jwc-dev-admin-"));
	const file = path.join(directory, "seed.sql");
	try {
		writeFileSync(file, sql, { mode: 0o600 });
		execFileSync("pnpm", ["exec", "void", "db", "migrate"], {
			stdio: "inherit",
		});
		execFileSync("pnpm", ["exec", "void", "db", "execute", "--file", file], {
			stdio: "inherit",
		});
	} finally {
		rmSync(directory, { force: true, recursive: true });
	}
}

function printResult(
	admin: { email: string; phoneNumber: string },
	credentials: DevAdminCredentials,
	siteUrl: string,
): void {
	const lines = [
		"",
		"로컬 개발 관리자를 만들었습니다 (휴대전화 인증·2단계 인증 등록 완료).",
		`  로그인     ${new URL("/admin/login", siteUrl).href}`,
		`  이메일     ${admin.email}`,
		`  비밀번호   ${credentials.password}`,
		`  휴대전화   ${admin.phoneNumber}`,
		"",
		"2단계 인증: 인증 앱에 아래 키(또는 URI)를 등록하거나, 복구 코드를 하나씩 쓰세요.",
		`  설정 키    ${credentials.setupKey}`,
		`  URI        ${credentials.totpUri}`,
		`  복구 코드  ${credentials.backupCodes.join("  ")}`,
		"",
		"다시 실행하면 비밀번호·인증 키·복구 코드가 새로 바뀌고 기존 세션은 끊깁니다.",
	];
	process.stdout.write(`${lines.join("\n")}\n`);
}

async function main(): Promise<void> {
	const values = parseSeedArgs(process.argv.slice(2));
	const env = EnvSchema.parse(process.env);
	assertLocalDevelopment({
		siteUrl: env.SITE_URL,
		nodeEnv: env.NODE_ENV,
		persistRoot: readPersistRoot(),
	});
	const admin = selectRegistration({
		emails: env.ADMIN_EMAILS,
		phones: env.ADMIN_PHONES,
		email: values.email,
	});
	const credentials = await createDevAdminCredentials({
		email: admin.email,
		authSecret: env.BETTER_AUTH_SECRET,
		password: values.password,
	});
	executeLocalSql(
		devAdminSeedSql({ ...admin, stored: credentials.stored, now: Date.now() }),
	);
	printResult(admin, credentials, env.SITE_URL);
}

try {
	await main();
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
	process.stderr.write(`관리자 seed 실패: ${message}\n`);
	process.exitCode = 1;
}
