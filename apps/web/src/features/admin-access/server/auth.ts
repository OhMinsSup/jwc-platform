import { AsyncLocalStorage } from "node:async_hooks";

import { account, session, user, verification } from "@schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "void/db";
import { env } from "void/env";

import { adminEmails } from "../../../platform/server/runtime";
import { normalizeEmail } from "../domain/admin-signup";
import { ADMIN_PASSWORD_MIN_LENGTH } from "../model/admin-access";

const SESSION_DAYS = 7;
const DAY_SECONDS = 86_400;

export function isAllowedAdmin(email: string): boolean {
	return adminEmails().has(normalizeEmail(email));
}

/**
 * 승인된 가입 표시. 초대/부트스트랩을 통과한 가입(services/admin-access.ts)만 이 범위 안에서 계정을 만든다.
 * HTTP 가입 엔드포인트는 워커가 막지만(security/policy.ts), 그 경로를 우회해 Better Auth에 닿아도
 * 이 표시가 없으면 계정 생성 훅이 거절한다 (심층 방어).
 */
const approvedSignup = new AsyncLocalStorage<{ email: string }>();

export function runApprovedSignup<T>(
	email: string,
	run: () => Promise<T>,
): Promise<T> {
	return approvedSignup.run({ email: normalizeEmail(email) }, run);
}

function isApprovedSignup(email: string): boolean {
	return approvedSignup.getStore()?.email === normalizeEmail(email);
}

function createAuth() {
	return betterAuth({
		baseURL: env.SITE_URL,
		secret: env.BETTER_AUTH_SECRET,
		trustedOrigins: [env.SITE_URL],
		database: drizzleAdapter(db, {
			provider: "sqlite",
			schema: {
				user,
				session,
				account,
				verification,
			},
			// D1은 대화형 트랜잭션을 지원하지 않는다
			transaction: false,
		}),
		emailAndPassword: {
			enabled: true,
			minPasswordLength: ADMIN_PASSWORD_MIN_LENGTH,
			// 서버 측 가입(초대 확인 후 api.signUpEmail)이 동작해야 한다. 공개 가입은 아래 훅과 워커가 막는다
			disableSignUp: false,
		},
		session: { expiresIn: SESSION_DAYS * DAY_SECONDS },
		databaseHooks: {
			user: {
				create: {
					// 허용 목록 + 승인된 가입 범위 둘 다 만족해야 계정을 만든다 (거절 문장은 사유를 드러내지 않는다)
					before: (newUser) => {
						if (
							!(
								isAllowedAdmin(newUser.email) && isApprovedSignup(newUser.email)
							)
						) {
							throw new APIError("FORBIDDEN", {
								message: "가입할 수 없습니다",
							});
						}
						return Promise.resolve({ data: newUser });
					},
				},
			},
		},
		plugins: [tanstackStartCookies()],
	});
}

let instance: ReturnType<typeof createAuth> | null = null;

/** env/바인딩은 요청 시점에 준비되므로 지연 생성 */
export function getAuth() {
	instance ??= createAuth();
	return instance;
}
