import type { InviteStatus } from "../model/admin-access";

/**
 * 관리자 가입 경로 판단 (순수 함수). I/O 없이 사실(facts)만 받아 경로를 돌려준다.
 * - 초대 코드가 있으면 초대 경로만 시도한다 (코드가 틀렸다고 부트스트랩으로 넘어가지 않는다)
 * - 코드가 없으면 첫 관리자 부트스트랩: 가입 허용 설정이 켜져 있고 계정이 하나도 없을 때만
 */

/** 거절 사유 (로그용 내부 값. 사용자에게는 모두 같은 문장을 보여 준다) */
export type SignupRejectReason =
	| "not_allowlisted"
	| "invite_invalid"
	| "invite_required"
	| "bootstrap_closed"
	| "auth_rejected";

export interface SignupFacts {
	allowlisted: boolean;
	bootstrapEnabled: boolean;
	existingUsers: number;
	hasInviteCode: boolean;
}

export type SignupDecision =
	| { kind: "invite" }
	| { kind: "bootstrap" }
	| { kind: "reject"; reason: SignupRejectReason };

function reject(reason: SignupRejectReason): SignupDecision {
	return { kind: "reject", reason };
}

export function decideSignupPath(facts: SignupFacts): SignupDecision {
	if (!facts.allowlisted) {
		return reject("not_allowlisted");
	}
	if (facts.hasInviteCode) {
		return { kind: "invite" };
	}
	if (!facts.bootstrapEnabled) {
		return reject("bootstrap_closed");
	}
	return facts.existingUsers === 0
		? { kind: "bootstrap" }
		: reject("invite_required");
}

/** 이메일 비교 기준 (허용 목록, 초대, Better Auth 모두 소문자로 저장한다) */
export function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

/** 초대 상태: 사용 여부가 만료보다 우선한다 (사용된 초대는 만료 뒤에도 "사용") */
export function inviteStatus(
	invite: { expiresAt: number; usedAt: number | null },
	now: number,
): InviteStatus {
	if (invite.usedAt !== null) {
		return "used";
	}
	return invite.expiresAt <= now ? "expired" : "pending";
}
