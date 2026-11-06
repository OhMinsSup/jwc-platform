import { isAPIError } from "better-auth/api";

import { InvalidInputError } from "../../../platform/server/errors/invalid-input-error";
import { log } from "../../../platform/server/log";
import type { AdminRegistration } from "../domain/admin-directory";
import type { SignupInput } from "../domain/admin-input";
import { decideSignupPath, normalizeEmail } from "../domain/admin-signup";
import type { SignupRejectReason } from "../domain/admin-signup";
import { runApprovedSignup } from "./approved-signup";
import type { getAuth } from "./auth";
import { isInviteCodeShape } from "./invite-code";
import { phoneOperations } from "./phone-operations";

export interface SignupInvites {
	countUsers: () => Promise<number>;
	claim: (input: {
		codeHash: string;
		email: string;
		now: number;
	}) => Promise<string | null>;
	release: (id: string) => Promise<void>;
}

interface SignupDependencies {
	auth: Pick<ReturnType<typeof getAuth>, "api">;
	invites: SignupInvites;
	registrationFor: (email: string) => AdminRegistration | null;
	bootstrapEnabled: boolean;
	hashInvite: (code: string) => Promise<string>;
}

type SignupAdmission =
	| { path: "invite"; inviteId: string }
	| { path: "bootstrap"; inviteId: null };
type SignedUpAdmin = SignupAdmission & { userId: string };

function rejectSignup(
	reason: SignupRejectReason,
	authCode: string | null = null,
) {
	log.warn("admin.signup_rejected", { reason, authCode });
	return new InvalidInputError(
		"가입할 수 없습니다. 가입 정보와 문자 인증번호를 확인해주세요",
	);
}

async function admitSignup(
	deps: SignupDependencies,
	input: { email: string; inviteCode: string; now: number },
): Promise<SignupAdmission> {
	const decision = decideSignupPath({
		allowlisted: deps.registrationFor(input.email) !== null,
		hasInviteCode: input.inviteCode !== "",
		bootstrapEnabled: deps.bootstrapEnabled,
		existingUsers: await deps.invites.countUsers(),
	});
	if (decision.kind === "reject") {
		throw rejectSignup(decision.reason);
	}
	if (decision.kind === "bootstrap") {
		return { path: "bootstrap", inviteId: null };
	}
	if (!isInviteCodeShape(input.inviteCode)) {
		throw rejectSignup("invite_invalid");
	}
	const inviteId = await deps.invites.claim({
		codeHash: await deps.hashInvite(input.inviteCode),
		email: input.email,
		now: input.now,
	});
	if (inviteId === null) {
		throw rejectSignup("invite_invalid");
	}
	return { path: "invite", inviteId };
}

function createApprovedAccount(
	deps: SignupDependencies,
	input: SignupInput,
	admitted: SignupAdmission,
	headers: Headers,
) {
	return runApprovedSignup(
		{
			email: input.email,
			bootstrap: admitted.path === "bootstrap",
			phoneNumber: input.phoneNumber,
		},
		() =>
			deps.auth.api.signUpEmail({
				body: {
					name: input.name,
					email: input.email,
					password: input.password,
				},
				headers,
			}),
	);
}

/** 내부 seam: 운영 DB adapter와 로컬 adapter에서 같은 가입 절차를 실행한다. */
export function createAdminSignup(deps: SignupDependencies) {
	const phone = phoneOperations(
		deps.auth,
		(email) => deps.registrationFor(email)?.phoneNumber ?? null,
	);
	return async (
		input: SignupInput,
		headers: Headers,
		now: number,
	): Promise<SignedUpAdmin> => {
		const normalized = { ...input, email: normalizeEmail(input.email) };
		const admitted = await admitSignup(deps, {
			email: normalized.email,
			inviteCode: input.inviteCode?.trim() ?? "",
			now,
		});
		try {
			await phone.consumeCode(normalized);
			const { user } = await createApprovedAccount(
				deps,
				normalized,
				admitted,
				headers,
			);
			log.info("admin.signed_up", { userId: user.id, path: admitted.path });
			return { ...admitted, userId: user.id };
		} catch (error) {
			if (admitted.inviteId !== null) {
				await deps.invites.release(admitted.inviteId);
			}
			if (isAPIError(error)) {
				throw rejectSignup("auth_rejected", error.body?.code ?? null);
			}
			throw error;
		}
	};
}
