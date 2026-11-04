/** 폼 접수 상태 (DB enum: forms.status) → 표시 이름과 색. 상태가 늘면 이 표에 한 줄 추가 */
export const FORM_STATUS_META = {
	draft: {
		label: "초안",
		hint: "아직 발행하지 않음",
		badgeClass: "bg-muted text-muted-foreground",
		dotClass: "bg-muted-foreground/60",
	},
	open: {
		label: "접수 중",
		hint: "신청을 받고 있음",
		badgeClass: "bg-success-soft text-success",
		dotClass: "bg-success",
	},
	closed: {
		label: "마감",
		hint: "신청을 받지 않음",
		badgeClass: "bg-warning-soft text-warning",
		dotClass: "bg-warning",
	},
} as const;

export type FormStatus = keyof typeof FORM_STATUS_META;
