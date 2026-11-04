import { randomId } from "@jwc/common/encoding";
import { isAPIError } from "better-auth/api";

import { ConflictError } from "../../../platform/server/errors/conflict-error";
import { InvalidInputError } from "../../../platform/server/errors/invalid-input-error";
import { log } from "../../../platform/server/log";
import { adminSignupEnabled, dataKeys } from "../../../platform/server/runtime";
import {
	decideSignupPath,
	inviteStatus,
	normalizeEmail,
} from "../domain/admin-signup";
import type { SignupRejectReason } from "../domain/admin-signup";
import type { InviteStatus } from "../model/admin-access";
import {
	claimInvite,
	countUsers,
	insertInvite,
	listRecentInvites,
	unclaimInvite,
	userExistsByEmail,
} from "./admin-invites-repository";
import { getAuth, isAllowedAdmin, runApprovedSignup } from "./auth";
import {
	generateInviteCode,
	inviteCodeHash,
	isInviteCodeShape,
} from "./invite-code";
import type { AdminUser } from "./session";

/**
 * 관리자 접근: 초대 발급, 초대/부트스트랩 가입. 경로 판단은 domain/admin-signup.ts(순수 함수)가 한다.
 */

const DAY_MS = 86_400_000;
/** 초대 유효 기간 */
const INVITE_TTL_MS = 7 * DAY_MS;
const RECENT_INVITES = 50;

/** 모든 가입 거절에 쓰는 같은 문장. 어떤 조건이 틀렸는지(허용 목록/코드/만료/중복 이메일) 드러내지 않는다 */
const SIGNUP_REJECTED_MESSAGE =
	"가입할 수 없습니다. 초대 코드와 이메일을 확인해주세요";

export interface CreatedInvite {
	/** 원문 코드. 이 응답에서 한 번만 돌려준다 (저장은 해시만) */
	code: string;
	email: string;
	expiresAt: number;
	id: string;
}

export async function createInvite(
	actor: AdminUser,
	rawEmail: string,
	now: number,
): Promise<CreatedInvite> {
	const email = normalizeEmail(rawEmail);
	if (!isAllowedAdmin(email)) {
		throw new InvalidInputError(
			"관리자 허용 목록(ADMIN_EMAILS)에 없는 이메일입니다. 먼저 허용 목록에 추가해주세요",
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
		expiresAt: now + INVITE_TTL_MS,
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

export interface SignupInput {
	email: string;
	/** 빈 문자열/없음 = 첫 관리자 부트스트랩 시도 */
	inviteCode?: string;
	name: string;
	password: string;
}

export interface SignedUpAdmin {
	inviteId: string | null;
	path: "invite" | "bootstrap";
	userId: string;
}

/** 내부 사유는 로그로만 남기고, 사용자에게는 같은 문장을 돌려준다 */
function rejectSignup(
	reason: SignupRejectReason,
	authCode: string | null = null,
): InvalidInputError {
	log.warn("admin.signup_rejected", { reason, authCode });
	return new InvalidInputError(SIGNUP_REJECTED_MESSAGE);
}

/** 가입 경로를 정하고, 초대 경로면 초대를 원자적으로 사용 처리한다. 거절이면 던진다 */
async function admitSignup(
	email: string,
	inviteCode: string,
	now: number,
): Promise<{ path: "invite" | "bootstrap"; inviteId: string | null }> {
	const decision = decideSignupPath({
		allowlisted: isAllowedAdmin(email),
		hasInviteCode: inviteCode !== "",
		bootstrapEnabled: adminSignupEnabled(),
		existingUsers: await countUsers(),
	});
	if (decision.kind === "reject") {
		throw rejectSignup(decision.reason);
	}
	if (decision.kind === "bootstrap") {
		return { path: "bootstrap", inviteId: null };
	}
	if (!isInviteCodeShape(inviteCode)) {
		throw rejectSignup("invite_invalid");
	}
	const keys = await dataKeys();
	const inviteId = await claimInvite({
		codeHash: await inviteCodeHash(keys.identity, inviteCode),
		email,
		now,
	});
	if (inviteId === null) {
		throw rejectSignup("invite_invalid");
	}
	return { path: "invite", inviteId };
}

function authCodeOf(error: { body?: { code?: string } }): string | null {
	return error.body?.code ?? null;
}

/**
 * 관리자 가입. 유효한 초대(이메일에 묶인 1회용) 또는 첫 관리자 부트스트랩만 통과한다.
 * Better Auth 호출은 서버 측(api.signUpEmail)이고, 세션 쿠키는 tanstackStartCookies 플러그인이
 * 현재 서버 함수 응답에 싣는다. 계정 생성이 실패하면 사용한 초대를 되돌린다.
 */
export async function signUpAdmin(
	input: SignupInput,
	headers: Headers,
	now: number,
): Promise<SignedUpAdmin> {
	const email = normalizeEmail(input.email);
	const admitted = await admitSignup(
		email,
		input.inviteCode?.trim() ?? "",
		now,
	);
	try {
		const { user } = await runApprovedSignup(email, () =>
			getAuth().api.signUpEmail({
				body: { name: input.name, email, password: input.password },
				headers,
			}),
		);
		log.info("admin.signed_up", { userId: user.id, path: admitted.path });
		return { ...admitted, userId: user.id };
	} catch (error) {
		if (admitted.inviteId !== null) {
			await unclaimInvite(admitted.inviteId);
		}
		// Better Auth 거절(중복 이메일, 비밀번호 정책 등)만 같은 문장으로 바꾼다. 그 밖의 장애는 그대로 분류된다
		if (isAPIError(error)) {
			throw rejectSignup("auth_rejected", authCodeOf(error));
		}
		throw error;
	}
}
