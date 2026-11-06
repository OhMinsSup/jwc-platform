import { z } from "zod";

import { ADMIN_AUTH_POLICY } from "./admin-auth-policy";
import { AdminPhoneSchema } from "./admin-phone";

const MAX_EMAIL_LENGTH = 254;
const MAX_NAME_LENGTH = 50;
const MAX_INVITE_CODE_LENGTH = 64;

export const AdminSmsCodeSchema = z
	.string()
	.length(ADMIN_AUTH_POLICY.sms.codeLength)
	.regex(/^\d+$/u);

export const AdminSmsIdentitySchema = z.object({
	email: z.email().max(MAX_EMAIL_LENGTH),
	phoneNumber: AdminPhoneSchema,
});

export const AdminSignupSchema = z.object({
	phoneNumber: AdminPhoneSchema,
	code: AdminSmsCodeSchema,
	name: z.string().trim().min(1).max(MAX_NAME_LENGTH),
	email: z.string().trim().max(MAX_EMAIL_LENGTH),
	// 가입 거절 문구를 통일하기 위해 최소 길이는 인증 엔진에서 판단한다.
	password: z.string().max(ADMIN_AUTH_POLICY.password.maxLength),
	inviteCode: z.string().trim().max(MAX_INVITE_CODE_LENGTH).optional(),
});

export type SignupInput = z.infer<typeof AdminSignupSchema>;
export type PhoneIdentity = z.infer<typeof AdminSmsIdentitySchema>;
