import { StatusBadge } from "@jwc/ui-patterns/components/status-badge";

import { FORM_STATUS_META } from "../model/form-status";
import type { FormStatus } from "../model/form-status";

/** 폼 상태 배지: 상태 → 라벨/색은 FORM_STATUS_META 표에서 온다 */
export function FormStatusBadge({
	status,
	className,
}: {
	status: FormStatus;
	className?: string;
}) {
	const meta = FORM_STATUS_META[status];
	return (
		<StatusBadge
			badgeClass={meta.badgeClass}
			className={className}
			dotClass={meta.dotClass}
			hint={meta.hint}
			label={meta.label}
		/>
	);
}
