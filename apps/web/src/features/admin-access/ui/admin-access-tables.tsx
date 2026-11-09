import { cn } from "@jwc/ui/lib/utils";
import type { ReactNode } from "react";

import { DateTimeText } from "../../../platform/ui/date-time-text";
import {
	AUDIT_ACTION_LABELS,
	INVITE_STATUS_LABELS,
} from "../model/admin-access";
import type { InviteStatus } from "../model/admin-access";

export interface InviteItem {
	createdAt: number;
	email: string;
	expiresAt: number;
	id: string;
	status: InviteStatus;
}

export interface AuditItem {
	action: string;
	actorName: string | null;
	at: number;
	id: string;
	targetId: string;
	targetType: string;
}

/** 초대 상태 → 배지 색. 색 + 글자로 구분한다 */
const INVITE_STATUS_CLASS: Record<InviteStatus, string> = {
	pending: "bg-warning-soft text-warning",
	used: "bg-success-soft text-success-ink",
	expired: "bg-muted text-muted-foreground",
};

const TH =
	"bg-muted/60 px-4 py-2.5 text-left font-medium text-muted-foreground text-xs";
const TD = "px-4 py-2.5";

function isAuditAction(
	action: string,
): action is keyof typeof AUDIT_ACTION_LABELS {
	return action in AUDIT_ACTION_LABELS;
}

/** 표에 없는 작업(이전 버전 기록 등)은 원래 이름을 그대로 보여 준다 */
function auditLabel(action: string): string {
	return isAuditAction(action) ? AUDIT_ACTION_LABELS[action] : action;
}

function TableFrame({
	caption,
	children,
}: {
	caption: string;
	children: ReactNode;
}) {
	return (
		<div className="bg-card overflow-auto rounded-xl border">
			<table className="w-full text-sm whitespace-nowrap">
				<caption className="sr-only">{caption}</caption>
				{children}
			</table>
		</div>
	);
}

function InviteBadge({ status }: { status: InviteStatus }) {
	return (
		<span
			className={cn(
				"inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
				INVITE_STATUS_CLASS[status],
			)}
		>
			{INVITE_STATUS_LABELS[status]}
		</span>
	);
}

export function InvitesTable({ invites }: { invites: readonly InviteItem[] }) {
	return (
		<TableFrame caption="최근 초대">
			<thead>
				<tr>
					<th className={TH} scope="col">
						이메일
					</th>
					<th className={TH} scope="col">
						발급
					</th>
					<th className={TH} scope="col">
						만료
					</th>
					<th className={TH} scope="col">
						상태
					</th>
				</tr>
			</thead>
			<tbody className="divide-y">
				{invites.map((invite) => (
					<tr className="hover:bg-muted/40" key={invite.id}>
						<td className={cn(TD, "font-medium")}>{invite.email}</td>
						<td className={cn(TD, "text-muted-foreground tabular-nums")}>
							<DateTimeText value={invite.createdAt} />
						</td>
						<td className={cn(TD, "text-muted-foreground tabular-nums")}>
							<DateTimeText value={invite.expiresAt} />
						</td>
						<td className={TD}>
							<InviteBadge status={invite.status} />
						</td>
					</tr>
				))}
			</tbody>
		</TableFrame>
	);
}

export function AuditTable({ entries }: { entries: readonly AuditItem[] }) {
	return (
		<TableFrame caption="최근 활동">
			<thead>
				<tr>
					<th className={TH} scope="col">
						시각
					</th>
					<th className={TH} scope="col">
						작업
					</th>
					<th className={TH} scope="col">
						관리자
					</th>
					<th className={TH} scope="col">
						대상
					</th>
				</tr>
			</thead>
			<tbody className="divide-y">
				{entries.map((entry) => (
					<tr className="hover:bg-muted/40" key={entry.id}>
						<td className={cn(TD, "text-muted-foreground tabular-nums")}>
							<DateTimeText value={entry.at} />
						</td>
						<td className={cn(TD, "font-medium")}>
							{auditLabel(entry.action)}
						</td>
						<td className={TD}>{entry.actorName ?? "(삭제된 계정)"}</td>
						<td className={cn(TD, "text-muted-foreground font-mono text-xs")}>
							{entry.targetType}/{entry.targetId}
						</td>
					</tr>
				))}
			</tbody>
		</TableFrame>
	);
}
