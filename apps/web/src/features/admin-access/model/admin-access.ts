/**
 * 관리자 접근(가입/초대/감사 기록) 공용 데이터. 서버와 화면이 같은 표를 쓴다.
 */

/** 감사 기록 작업 → 화면 이름. 새 작업은 이 표에 한 줄 추가 */
export const AUDIT_ACTION_LABELS = {
	"form.created": "폼 생성",
	"form.published": "폼 발행",
	"form.status_changed": "접수 상태 변경",
	"submission.paid_changed": "납입 상태 변경",
	"admin.invite_created": "관리자 초대",
	"admin.signed_up": "관리자 가입",
} as const;

export type AuditAction = keyof typeof AUDIT_ACTION_LABELS;

/** 초대 상태 → 화면 이름 */
export const INVITE_STATUS_LABELS = {
	pending: "대기",
	used: "사용",
	expired: "만료",
} as const;

export type InviteStatus = keyof typeof INVITE_STATUS_LABELS;
