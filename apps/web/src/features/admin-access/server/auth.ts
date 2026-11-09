import { account, session, twoFactor, user, verification } from "@schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "void/db";

import {
	authRuntimeConfig,
	authSmsSender,
} from "../../../platform/server/runtime";
import { enforceRateLimit } from "../../../platform/server/security/rate-limit";
import { parseAdminDirectory } from "../domain/admin-directory";
import { normalizeEmail } from "../domain/admin-signup";
import { ADMIN_SMS_VALIDITY_TEXT } from "../model/admin-auth";
import { adminAuthOptions } from "./auth-options";

export function adminRegistration(email: string) {
	const config = authRuntimeConfig();
	return (
		parseAdminDirectory({
			emails: config.adminEmails,
			phones: config.adminPhones,
		}).get(normalizeEmail(email)) ?? null
	);
}

async function sendAuthSms(phone: string, code: string): Promise<void> {
	await enforceRateLimit("admin_sms", `phone:${phone}`, Date.now());
	await authSmsSender().send(
		phone,
		`[JWC] 인증번호는 ${code}입니다. ${ADMIN_SMS_VALIDITY_TEXT} 안에 입력해주세요. 요청하지 않았다면 이 문자를 무시하세요.`,
	);
}

function createAuth() {
	const options = adminAuthOptions({
		...authRuntimeConfig(),
		registrationFor: adminRegistration,
		sendSms: sendAuthSms,
	});
	return betterAuth({
		...options,
		database: drizzleAdapter(db, {
			provider: "sqlite",
			schema: { user, session, account, verification, twoFactor },
			transaction: false,
		}),
		plugins: [...options.plugins, tanstackStartCookies()],
	});
}

let instance: ReturnType<typeof createAuth> | null = null;

export function getAuth() {
	instance ??= createAuth();
	return instance;
}
