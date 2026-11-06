import type { BetterAuthOptions } from "better-auth";
import {
	APIError,
	createAuthMiddleware,
	getSessionFromCtx,
} from "better-auth/api";
import { phoneNumber } from "better-auth/plugins/phone-number";
import { twoFactor } from "better-auth/plugins/two-factor";

import { ADMIN_AUTH_POLICY } from "../domain/admin-auth-policy";
import { hasVerifiedAdminPhone } from "../domain/admin-auth-state";
import type { AdminRegistration } from "../domain/admin-directory";
import { AdminPhoneSchema } from "../domain/admin-phone";
import { approvedSignupFor, isApprovedPhoneAction } from "./approved-signup";

interface AuthConfig {
	siteUrl: string;
	secret: string;
	registrationFor: (email: string) => AdminRegistration | null;
	sendSms: (phone: string, code: string) => Promise<void>;
}

function databaseHooks(config: AuthConfig) {
	return {
		user: {
			create: {
				before: (newUser) => {
					const approval = approvedSignupFor(newUser.email);
					const registration = config.registrationFor(newUser.email);
					if (
						!(
							registration &&
							approval &&
							registration.phoneNumber === approval.phoneNumber
						)
					) {
						throw new APIError("FORBIDDEN", { message: "가입할 수 없습니다" });
					}
					return Promise.resolve({
						data: {
							...newUser,
							bootstrapAdmin: approval.bootstrap,
							phoneNumber: approval.phoneNumber,
							phoneNumberVerified: true,
						},
					});
				},
			},
			update: {
				after: async (updatedUser, context) => {
					if (
						"twoFactorEnabled" in updatedUser &&
						updatedUser.twoFactorEnabled === true
					) {
						await context?.context.internalAdapter.deleteUserSessions(
							updatedUser.id,
						);
					}
				},
			},
		},
	} satisfies NonNullable<BetterAuthOptions["databaseHooks"]>;
}

function guardPhoneEndpoint(path: string | undefined) {
	if (
		(path?.startsWith("/phone-number/") && !isApprovedPhoneAction()) ||
		path === "/sign-in/phone-number"
	) {
		throw new APIError("FORBIDDEN", {
			message: "관리자 인증 화면을 이용해주세요",
		});
	}
}

function authGuard(config: AuthConfig) {
	return createAuthMiddleware(async (ctx) => {
		guardPhoneEndpoint(ctx.path);
		if (ctx.path === "/two-factor/disable") {
			throw new APIError("FORBIDDEN", {
				message: "관리자 2단계 인증은 해제할 수 없습니다",
			});
		}
		if (!ctx.path?.startsWith("/two-factor/")) {
			return;
		}
		const session = await getSessionFromCtx(ctx, { disableCookieCache: true });
		const registration = session
			? config.registrationFor(session.user.email)
			: null;
		if (
			session &&
			!(
				registration &&
				hasVerifiedAdminPhone(session.user, registration.phoneNumber)
			)
		) {
			throw new APIError("FORBIDDEN", {
				message: "휴대전화 인증이 필요합니다",
			});
		}
	});
}

export function adminAuthOptions(config: AuthConfig) {
	return {
		appName: "JWC 신청서",
		baseURL: config.siteUrl,
		secret: config.secret,
		trustedOrigins: [config.siteUrl],
		emailAndPassword: {
			enabled: true,
			minPasswordLength: ADMIN_AUTH_POLICY.password.minLength,
			maxPasswordLength: ADMIN_AUTH_POLICY.password.maxLength,
			autoSignIn: false,
			revokeSessionsOnPasswordReset: true,
		},
		user: {
			additionalFields: {
				bootstrapAdmin: {
					type: "boolean",
					defaultValue: false,
					input: false,
					returned: false,
				},
			},
		},
		session: {
			expiresIn: ADMIN_AUTH_POLICY.session.expiresInSeconds,
			cookieCache: { enabled: false },
		},
		logger: { disabled: true },
		hooks: { before: authGuard(config) },
		databaseHooks: databaseHooks(config),
		plugins: [
			twoFactor({
				issuer: "JWC 신청서",
				totpOptions: { digits: ADMIN_AUTH_POLICY.totp.codeLength },
			}),
			phoneNumber({
				expiresIn: ADMIN_AUTH_POLICY.sms.expiresInSeconds,
				otpLength: ADMIN_AUTH_POLICY.sms.codeLength,
				allowedAttempts: ADMIN_AUTH_POLICY.sms.maxAttempts,
				requireVerification: true,
				phoneNumberValidator: (phone) =>
					AdminPhoneSchema.safeParse(phone).success,
				sendOTP: ({ phoneNumber: phone, code }) => config.sendSms(phone, code),
				sendPasswordResetOTP: ({ phoneNumber: phone, code }) =>
					config.sendSms(phone, code),
			}),
		],
	} satisfies BetterAuthOptions;
}
