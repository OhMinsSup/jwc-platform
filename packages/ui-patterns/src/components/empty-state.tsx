import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
	/** 다음에 할 일 (버튼 등) */
	action?: ReactNode;
	description?: string;
	icon: LucideIcon;
	title: string;
}

/** 비어 있을 때 "왜 비었고 무엇을 하면 되는지"를 알려준다. 틀과 머리는 유지하고 한 문장 + 다음 행동 */
export function EmptyState({
	icon: Icon,
	title,
	description,
	action,
}: EmptyStateProps) {
	return (
		<div className="bg-card flex flex-col items-center rounded-xl border border-dashed px-6 py-12 text-center">
			<Icon aria-hidden className="text-muted-foreground h-5 w-5" />
			<p className="mt-3 font-semibold">{title}</p>
			{description && (
				<p className="text-muted-foreground mt-1 max-w-sm text-sm">
					{description}
				</p>
			)}
			{Boolean(action) && <div className="mt-5">{action}</div>}
		</div>
	);
}
