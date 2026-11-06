import { isAPIError } from "better-auth/api";

import { InvalidInputError } from "../../../platform/server/errors/invalid-input-error";
import { UnauthorizedError } from "../../../platform/server/errors/unauthorized-error";
import type { PhoneIdentity } from "../domain/admin-input";
import { AdminPhoneSchema } from "../domain/admin-phone";
import { normalizeEmail } from "../domain/admin-signup";
import { runApprovedPhoneAction } from "./approved-signup";
import type { getAuth } from "./auth";

type AuthApi = ReturnType<typeof getAuth>["api"];
const REJECTED = "인증할 수 없습니다. 가입 정보와 인증번호를 확인해주세요";

async function performPhoneAction<T>(run: () => Promise<T>): Promise<T> {
	try {
		return await runApprovedPhoneAction(run);
	} catch (error) {
		if (isAPIError(error)) {
			throw new InvalidInputError(REJECTED);
		}
		throw error;
	}
}

export function phoneOperations(
	auth: { api: AuthApi },
	phoneForEmail: (email: string) => string | null,
) {
	const boundPhone = (identity: PhoneIdentity) =>
		boundPhoneFor(identity, phoneForEmail);
	return {
		requestCode: (identity: PhoneIdentity) =>
			performPhoneAction(() =>
				auth.api.sendPhoneNumberOTP({
					body: { phoneNumber: boundPhone(identity) },
				}),
			),
		consumeCode: (identity: PhoneIdentity & { code: string }) =>
			performPhoneAction(() =>
				auth.api.consumePhoneNumberOTP({
					body: { phoneNumber: boundPhone(identity), code: identity.code },
				}),
			),
		requestReset: (identity: PhoneIdentity) =>
			performPhoneAction(() =>
				auth.api.requestPasswordResetPhoneNumber({
					body: { phoneNumber: boundPhone(identity) },
				}),
			),
		resetPassword: (
			input: PhoneIdentity & { code: string; password: string },
		) =>
			performPhoneAction(() =>
				auth.api.resetPasswordPhoneNumber({
					body: {
						phoneNumber: boundPhone(input),
						otp: input.code,
						newPassword: input.password,
					},
				}),
			),
		verifySession: (
			input: { phoneNumber: string; code: string },
			headers: Headers,
		) => verifyPhoneSession(auth, input, headers, boundPhone),
	};
}

function boundPhoneFor(
	identity: PhoneIdentity,
	phoneForEmail: (email: string) => string | null,
): string {
	const parsed = AdminPhoneSchema.safeParse(identity.phoneNumber);
	if (
		!(
			parsed.success &&
			phoneForEmail(normalizeEmail(identity.email)) === parsed.data
		)
	) {
		throw new InvalidInputError(REJECTED);
	}
	return parsed.data;
}

async function verifyPhoneSession(
	auth: { api: AuthApi },
	input: { phoneNumber: string; code: string },
	headers: Headers,
	boundPhone: (identity: PhoneIdentity) => string,
) {
	const session = await auth.api.getSession({ headers });
	if (!session) {
		throw new UnauthorizedError();
	}
	const phoneNumber = boundPhone({
		email: session.user.email,
		phoneNumber: input.phoneNumber,
	});
	await performPhoneAction(() =>
		auth.api.verifyPhoneNumber({
			headers,
			body: {
				phoneNumber,
				code: input.code,
				updatePhoneNumber: session.user.phoneNumber !== phoneNumber,
				disableSession: true,
			},
		}),
	);
	await auth.api.signOut({ headers });
}
