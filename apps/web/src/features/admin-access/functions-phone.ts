import { clientIpOf } from "@jwc/security/rate-limit";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { z } from "zod";

import { enforceRateLimit } from "../../platform/server/security/rate-limit";
import { toResult } from "../../platform/server/server-fn";
import { ADMIN_AUTH_POLICY } from "./domain/admin-auth-policy";
import {
	AdminSmsIdentitySchema,
	AdminSmsCodeSchema,
} from "./domain/admin-input";
import { AdminPhoneSchema } from "./domain/admin-phone";
import { adminRegistration, getAuth } from "./server/auth";
import { phoneOperations } from "./server/phone-operations";

const VerifySchema = z.object({
	phoneNumber: AdminPhoneSchema,
	code: AdminSmsCodeSchema,
});
const ResetSchema = AdminSmsIdentitySchema.extend({
	code: AdminSmsCodeSchema,
	password: z
		.string()
		.min(ADMIN_AUTH_POLICY.password.minLength)
		.max(ADMIN_AUTH_POLICY.password.maxLength),
});

function adminPhoneOperations() {
	return phoneOperations(
		getAuth(),
		(email) => adminRegistration(email)?.phoneNumber ?? null,
	);
}

async function limitSms(verify: boolean) {
	const headers = getRequestHeaders();
	await enforceRateLimit(
		verify ? "admin_sms_verify" : "admin_sms",
		clientIpOf(headers),
		Date.now(),
	);
	return headers;
}

export const requestAdminSmsFn = createServerFn({ method: "POST" })
	.validator(AdminSmsIdentitySchema)
	.handler(({ data }) =>
		toResult("admin.requestSms", async () => {
			await limitSms(false);
			await adminPhoneOperations().requestCode(data);
		}),
	);

export const verifyAdminPhoneFn = createServerFn({ method: "POST" })
	.validator(VerifySchema)
	.handler(({ data }) =>
		toResult("admin.verifyPhone", async () => {
			const headers = await limitSms(true);
			await adminPhoneOperations().verifySession(data, headers);
		}),
	);

export const requestAdminPasswordResetFn = createServerFn({ method: "POST" })
	.validator(AdminSmsIdentitySchema)
	.handler(({ data }) =>
		toResult("admin.requestPasswordReset", async () => {
			await limitSms(false);
			await adminPhoneOperations().requestReset(data);
		}),
	);

export const resetAdminPasswordFn = createServerFn({ method: "POST" })
	.validator(ResetSchema)
	.handler(({ data }) =>
		toResult("admin.resetPassword", async () => {
			await limitSms(true);
			await adminPhoneOperations().resetPassword(data);
		}),
	);
