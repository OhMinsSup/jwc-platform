import { cn } from "@jwc/ui/lib/utils";

export interface StatusBadgeProps {
	/** 배지 배경/글자 색 클래스 (예: "bg-success-soft text-success") */
	badgeClass: string;
	className?: string;
	/** 점 색 클래스 (예: "bg-success") */
	dotClass: string;
	/** 마우스를 올렸을 때 설명 */
	hint?: string;
	label: string;
}

/** 색 + 점 + 글자: 색만으로 상태를 구분하지 않는다. 상태 → 색 매핑은 쓰는 쪽의 표로 정한다 */
export function StatusBadge({
	label,
	hint,
	badgeClass,
	dotClass,
	className,
}: StatusBadgeProps) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
				badgeClass,
				className,
			)}
			title={hint}
		>
			<span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", dotClass)} />
			{label}
		</span>
	);
}
