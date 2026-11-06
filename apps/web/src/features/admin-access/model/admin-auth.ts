import { ADMIN_AUTH_POLICY } from "../domain/admin-auth-policy";
import type { AdminAccessDecision } from "../domain/admin-auth-state";

export const ADMIN_AUTH_DESTINATIONS = {
	signed_out: "/admin/login",
	blocked: "/admin/login",
	verify_phone: "/admin/verify-phone",
	setup_two_factor: "/admin/setup-two-factor",
	ready: "/admin",
} as const satisfies Record<AdminAccessDecision["kind"], string>;

const CODE_FIELD = {
	name: "code",
	type: "text",
	autoComplete: "one-time-code",
	inputMode: "numeric",
} as const;

export const ADMIN_SMS_CODE_FIELD = {
	...CODE_FIELD,
	label: "문자 인증번호",
	pattern: `[0-9]{${ADMIN_AUTH_POLICY.sms.codeLength}}`,
	maxLength: ADMIN_AUTH_POLICY.sms.codeLength,
} as const;

export const ADMIN_TOTP_CODE_FIELD = {
	...CODE_FIELD,
	label: "인증 코드",
	pattern: `[0-9]{${ADMIN_AUTH_POLICY.totp.codeLength}}`,
	maxLength: ADMIN_AUTH_POLICY.totp.codeLength,
} as const;

const SECONDS_PER_MINUTE = 60;
export const ADMIN_SMS_VALIDITY_TEXT = `${ADMIN_AUTH_POLICY.sms.expiresInSeconds / SECONDS_PER_MINUTE}분`;
export const ADMIN_SMS_SENT_MESSAGE = `인증 문자를 보냈습니다. ${ADMIN_SMS_VALIDITY_TEXT} 안에 인증번호를 입력해주세요.`;
