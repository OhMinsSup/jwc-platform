import type { ReactNode } from "react";

interface PageHeaderProps {
	/** 오른쪽 주요 동작 */
	actions?: ReactNode;
	/** 제목 아래 (하위 탭 등) */
	children?: ReactNode;
	description?: ReactNode;
	/** 제목 위 작은 줄 (브레드크럼 등) */
	eyebrow?: ReactNode;
	title: ReactNode;
}

/** 모든 관리자 페이지의 머리. 제목은 페이지당 하나의 h1 */
export function PageHeader({
	title,
	description,
	eyebrow,
	actions,
	children,
}: PageHeaderProps) {
	return (
		<header className="space-y-4">
			{eyebrow}
			<div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
				<div className="min-w-0 space-y-1">
					<h1 className="font-display text-[26px] leading-tight font-bold tracking-[-0.03em] text-balance sm:text-[30px]">
						{title}
					</h1>
					{Boolean(description) && (
						<div className="text-muted-foreground text-sm">{description}</div>
					)}
				</div>
				{Boolean(actions) && (
					<div className="flex flex-wrap items-center gap-2">{actions}</div>
				)}
			</div>
			{children}
		</header>
	);
}
