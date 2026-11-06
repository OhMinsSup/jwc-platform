import { cn } from "@jwc/ui/lib/utils";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * 어조 → 테두리/옅은 면/아이콘 색. 글자는 본문색 그대로 둔다 (색 글자 문단은 읽기 어렵다).
 * typie 안내 상자: 1px 색 테두리 + 아주 옅은 같은 색 면 + 16px 아이콘.
 */
const TONES = {
	info: { box: "border-info bg-info/5", icon: "text-info", Icon: Info },
	success: {
		box: "border-success bg-success/5",
		icon: "text-success",
		Icon: CircleCheck,
	},
	warning: {
		box: "border-warning-accent bg-warning-accent/5",
		icon: "text-warning-accent",
		Icon: TriangleAlert,
	},
	danger: {
		box: "border-destructive bg-destructive/5",
		icon: "text-destructive",
		Icon: CircleAlert,
	},
} as const satisfies Record<
	string,
	{ box: string; icon: string; Icon: LucideIcon }
>;

export type CalloutTone = keyof typeof TONES;

interface CalloutProps {
	children?: ReactNode;
	className?: string;
	/** 아이콘을 바꿀 때 (기본: 어조별 아이콘) */
	icon?: LucideIcon;
	/** 실패 알림은 "alert", 참고 안내는 "note" (기본: 없음) */
	role?: "alert" | "note" | "status";
	/** 굵은 한 줄 제목 (없으면 본문만) */
	title?: ReactNode;
	tone?: CalloutTone;
}

/** 안내/주의/오류 상자. 색 + 아이콘 + 글자로 구분한다 (색만으로 구분하지 않음) */
export function Callout({
	tone = "info",
	title,
	icon,
	role,
	className,
	children,
}: CalloutProps) {
	const style = TONES[tone];
	const Icon = icon ?? style.Icon;
	return (
		<div
			className={cn(
				"flex gap-2 rounded-md border px-3 py-2.5 text-sm",
				style.box,
				className,
			)}
			role={role}
		>
			<Icon aria-hidden className={cn("mt-0.5 size-4 shrink-0", style.icon)} />
			<div className="min-w-0 flex-1 space-y-2">
				{Boolean(title) && <p className="font-medium">{title}</p>}
				{children}
			</div>
		</div>
	);
}
