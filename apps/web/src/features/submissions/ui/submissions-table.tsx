import { cn } from "@jwc/ui/lib/utils";
import type { ReactNode } from "react";

import { formatWon } from "../../../platform/format";
import { DateTimeText } from "../../../platform/ui/date-time-text";
import { SubmissionCards } from "./submission-cards";
import { IssueMark, PaidToggle, rowName } from "./submission-row";
import type { SubmissionColumn, SubmissionRow } from "./submission-row";

interface SubmissionsTableProps {
	columns: readonly SubmissionColumn[];
	/** 표 위 머리줄 (제목, 검색) */
	header: ReactNode;
	onTogglePaid: (row: SubmissionRow) => void;
	pendingId: string | null;
	rows: readonly SubmissionRow[];
}

/** 머리줄: 채움 띠 없이 12px 회색, 아래 1px 선 하나 (표 안에서 가장 진한 선) */
const TH =
	"bg-card border-b px-4 py-2.5 text-left font-normal text-muted-foreground text-xs";

function TableHead({ columns }: { columns: readonly SubmissionColumn[] }) {
	return (
		<thead className="sticky top-0 z-10">
			<tr>
				{columns.map((column, index) => (
					<th
						className={cn(TH, index === 0 && "sticky left-0 z-10")}
						key={column.id}
						scope="col"
					>
						{column.label}
					</th>
				))}
				<th className={TH} scope="col">
					제출일시
				</th>
				<th className={cn(TH, "text-right")} scope="col">
					회비
				</th>
				<th className={cn(TH, "text-right")} scope="col">
					안내 문자
				</th>
				<th className={TH} scope="col">
					납입
				</th>
			</tr>
		</thead>
	);
}

interface RowProps {
	columns: readonly SubmissionColumn[];
	onTogglePaid: (row: SubmissionRow) => void;
	pending: boolean;
	row: SubmissionRow;
}

function Row({ row, columns, pending, onTogglePaid }: RowProps) {
	const [first] = columns;
	return (
		<tr className="hover:bg-muted/70">
			{columns.map((column, index) => (
				<td
					className={cn(
						"max-w-56 truncate px-4 py-2.5",
						index === 0 && "bg-card sticky left-0 font-medium",
					)}
					key={column.id}
				>
					{index === 0 && row.issueHeaders.length > 0 && (
						<IssueMark headers={row.issueHeaders} />
					)}
					{row.cells[column.id]}
				</td>
			))}
			<td className="text-muted-foreground px-4 py-2.5 tabular-nums">
				<DateTimeText value={row.submittedAt} />
			</td>
			<td className="px-4 py-2.5 text-right tabular-nums">
				{row.amount === null ? (
					<span className="text-muted-foreground">—</span>
				) : (
					formatWon(row.amount)
				)}
			</td>
			<td className="text-muted-foreground px-4 py-2.5 text-right tabular-nums">
				{row.reminderCount}회
			</td>
			<td className="px-4 py-2.5">
				<PaidToggle
					name={rowName(row, first)}
					onToggle={onTogglePaid}
					pending={pending}
					row={row}
				/>
			</td>
		</tr>
	);
}

/** 응답 표. 헤더는 스크롤해도 고정, 가로 스크롤 시 첫 열(이름 등)도 고정 */
export function SubmissionsTable({
	columns,
	rows,
	header,
	pendingId,
	onTogglePaid,
}: SubmissionsTableProps) {
	return (
		<div className="bg-card overflow-hidden rounded-xl border">
			{header}
			{/* 넓은 화면: 표 / 좁은 화면: 응답 카드 목록 (가로 스크롤 없이 읽히게) */}
			<SubmissionCards
				columns={columns}
				onTogglePaid={onTogglePaid}
				pendingId={pendingId}
				rows={rows}
			/>
			<div className="hidden max-h-[70vh] overflow-auto md:block">
				<table className="w-full text-sm whitespace-nowrap">
					<TableHead columns={columns} />
					<tbody className="divide-rule divide-y">
						{rows.map((row) => (
							<Row
								columns={columns}
								key={row.id}
								onTogglePaid={onTogglePaid}
								pending={pendingId === row.id}
								row={row}
							/>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
