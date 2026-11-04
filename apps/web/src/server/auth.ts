// oxlint-disable-next-line import/no-namespace -- drizzle 어댑터에 스키마 테이블 전체를 객체로 넘겨야 한다
import * as schema from "@schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "void/db";
import { env } from "void/env";

import { adminEmails, adminSignupEnabled } from "./runtime";

const MIN_PASSWORD_LENGTH = 10;
const SESSION_DAYS = 7;
const DAY_SECONDS = 86_400;

export function isAllowedAdmin(email: string): boolean {
	return adminEmails().has(email.trim().toLowerCase());
}

function createAuth() {
	return betterAuth({
		baseURL: env.SITE_URL,
		secret: env.BETTER_AUTH_SECRET,
		trustedOrigins: [env.SITE_URL],
		database: drizzleAdapter(db, {
			provider: "sqlite",
			schema: {
				user: schema.user,
				session: schema.session,
				account: schema.account,
				verification: schema.verification,
			},
			// D1은 대화형 트랜잭션을 지원하지 않는다
			transaction: false,
		}),
		emailAndPassword: {
			enabled: true,
			minPasswordLength: MIN_PASSWORD_LENGTH,
			disableSignUp: !adminSignupEnabled(),
		},
		session: { expiresIn: SESSION_DAYS * DAY_SECONDS },
		databaseHooks: {
			user: {
				create: {
					// 허용 목록에 없는 이메일은 계정 자체를 만들지 않는다
					before: (user) => {
						if (!isAllowedAdmin(user.email)) {
							throw new APIError("FORBIDDEN", {
								message: "관리자 허용 목록에 없는 이메일입니다",
							});
						}
						return Promise.resolve({ data: user });
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
