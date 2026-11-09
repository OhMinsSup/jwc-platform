import { existsSync, readFileSync } from "node:fs";

import { z } from "zod";

import {
	assertLocalDevelopment,
	parseSeedArgs,
	selectRegistration,
} from "./dev-admin";

/**
 * 로컬 개발 관리자 명령(seed, 코드 출력)의 공통 경계: env 읽기 → 로컬 전용 확인 → 대상 선택.
 * 두 명령이 같은 확인을 거치도록 한 곳에 둔다.
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

export function loadDevAdminContext(argv: readonly string[]) {
	const args = parseSeedArgs(argv);
	const env = EnvSchema.parse(process.env);
	assertLocalDevelopment({
		siteUrl: env.SITE_URL,
		nodeEnv: env.NODE_ENV,
		persistRoot: readPersistRoot(),
	});
	const admin = selectRegistration({
		emails: env.ADMIN_EMAILS,
		phones: env.ADMIN_PHONES,
		email: args.email,
	});
	return {
		admin,
		authSecret: env.BETTER_AUTH_SECRET,
		siteUrl: env.SITE_URL,
		password: args.password,
	};
}
