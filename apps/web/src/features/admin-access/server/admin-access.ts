import { randomId } from "@jwc/common/encoding";

import { ConflictError } from "../../../platform/server/errors/conflict-error";
import { InvalidInputError } from "../../../platform/server/errors/invalid-input-error";
import { log } from "../../../platform/server/log";
import { adminSignupEnabled, dataKeys } from "../../../platform/server/runtime";
import { ADMIN_AUTH_POLICY } from "../domain/admin-auth-policy";
import type { AdminIdentity } from "../domain/admin-auth-state";
import type { SignupInput } from "../domain/admin-input";
import { inviteStatus, normalizeEmail } from "../domain/admin-signup";
import type { InviteStatus } from "../model/admin-access";
import {
	claimInvite,
	countUsers,
	insertInvite,
	listRecentInvites,
	unclaimInvite,
	userExistsByEmail,
} from "./admin-invites-repository";
import { createAdminSignup } from "./admin-signup";
import { getAuth, adminRegistration } from "./auth";
import { generateInviteCode, inviteCodeHash } from "./invite-code";

/**
 * 관리자 접근: 초대 발급, 초대/부트스트랩 가입. 경로 판단은 domain/admin-signup.ts(순수 함수)가 한다.
 */

const RECENT_INVITES = 50;

export interface CreatedInvite {
	/** 원문 코드. 이 응답에서 한 번만 돌려준다 (저장은 해시만) */
	code: string;
	email: string;
	expiresAt: number;
	id: string;
}

export async function createInvite(
	actor: AdminIdentity,
	rawEmail: string,
	now: number,
): Promise<CreatedInvite> {
	const email = normalizeEmail(rawEmail);
	if (!adminRegistration(email)?.phoneNumber) {
		throw new InvalidInputError(
			"먼저 ADMIN_EMAILS와 ADMIN_PHONES에 관리자 이메일과 휴대전화 번호를 등록해주세요",
			{ email: "허용 목록에 없는 이메일입니다" },
		);
	}
	if (await userExistsByEmail(email)) {
		throw new ConflictError("이미 가입한 관리자입니다");
	}
	const code = generateInviteCode();
	const keys = await dataKeys();
	const invite = {
		id: randomId(),
		email,
		createdBy: actor.id,
		createdAt: now,
		expiresAt: now + ADMIN_AUTH_POLICY.invite.expiresInMs,
	};
	await insertInvite({
		...invite,
		codeHash: await inviteCodeHash(keys.identity, code),
	});
	log.info("admin.invite_created", { inviteId: invite.id });
	return { id: invite.id, code, email, expiresAt: invite.expiresAt };
}

export interface InviteSummary {
	createdAt: number;
	email: string;
	expiresAt: number;
	id: string;
	status: InviteStatus;
}

export async function recentInvites(now: number): Promise<InviteSummary[]> {
	const rows = await listRecentInvites(RECENT_INVITES);
	return rows.map((row) => ({
		id: row.id,
		email: row.email,
		createdAt: row.createdAt,
		expiresAt: row.expiresAt,
		status: inviteStatus(row, now),
	}));
}

/** 운영 adapter 조립. 가입 순서와 승인·복구는 가입 모듈이 책임진다. */
export function signUpAdmin(input: SignupInput, headers: Headers, now: number) {
	return createAdminSignup({
		auth: getAuth(),
		registrationFor: adminRegistration,
		bootstrapEnabled: adminSignupEnabled(),
		invites: { countUsers, claim: claimInvite, release: unclaimInvite },
		hashInvite: async (code) => {
			const keys = await dataKeys();
			return await inviteCodeHash(keys.identity, code);
		},
	})(input, headers, now);
}
