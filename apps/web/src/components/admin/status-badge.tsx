import { cn } from "@jwc/ui/lib/utils";

import { FORM_STATUS_META } from "../../lib/form-status";
import type { FormStatus } from "../../lib/form-status";

/** 색 + 점 + 글자: 색만으로 상태를 구분하지 않는다 */
export function StatusBadge({
	status,
	className,
}: {
	status: FormStatus;
	className?: string;
}) {
	const meta = FORM_STATUS_META[status];
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
				meta.badgeClass,
				className,
			)}
			title={meta.hint}
		>
			<span
				aria-hidden
				className={cn("h-1.5 w-1.5 rounded-full", meta.dotClass)}
			/>
			{meta.label}
		</span>
	);
}
