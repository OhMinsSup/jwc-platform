import { cn } from "@jwc/ui";
import type { LucideIcon } from "lucide-react";
import { Search } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
	/** 아이콘 컴포넌트 */
	icon?: LucideIcon;
	/** 제목 */
	title?: string;
	/** 설명 */
	description?: string;
	/** 추가 액션 (버튼 등) */
	action?: ReactNode;
	/** 컨테이너 높이 */
	height?: string;
	/** 추가 클래스 */
	className?: string;
}

/**
 * 빈 상태 컴포넌트
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={Search}
 *   title="검색 결과가 없습니다"
 *   description="다른 검색어로 시도해보세요."
 *   action={<Button>초기화</Button>}
 * />
 * ```
 */
export function EmptyState({
	icon: Icon = Search,
	title = "검색 결과가 없습니다",
	description,
	action,
	height = "h-64",
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				"flex items-center justify-center rounded-xl border bg-card/50",
				height,
				className
			)}
		>
			<div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
				<Icon className="h-8 w-8 opacity-50" />
				<p className="font-medium">{title}</p>
				{description && <p className="text-sm">{description}</p>}
				{action && <div className="mt-4">{action}</div>}
			</div>
		</div>
	);
}
