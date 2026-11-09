import { formatWon } from "../../../platform/format";
import { DateTimeText } from "../../../platform/ui/date-time-text";
import { IssueMark, PaidToggle, rowName } from "./submission-row";
import type { SubmissionColumn, SubmissionRow } from "./submission-row";

/** 카드 둘째 줄에 보여 줄 질문 수 (첫 열 = 이름은 제목 줄에 있으므로 그다음부터) */
const DETAIL_COLUMN_COUNT = 3;

interface SubmissionCardsProps {
	columns: readonly SubmissionColumn[];
	onTogglePaid: (row: SubmissionRow) => void;
	pendingId: string | null;
	rows: readonly SubmissionRow[];
}

/** 둘째 줄: 이름 다음 질문 몇 개의 값을 " · "로 잇는다 (빈 값은 건너뜀) */
function detailLine(row: SubmissionRow, columns: readonly SubmissionColumn[]) {
	return columns
		.slice(1, 1 + DETAIL_COLUMN_COUNT)
		.map((column) => row.cells[column.id])
		.filter((value) => value !== undefined && value !== "")
		.join(" · ");
}

/**
 * 좁은 화면용 응답 목록. 표의 가로 스크롤 대신 응답 하나 = 카드 한 줄 묶음:
 * 이름 + 납입 버튼 / 주요 답변 / 회비 · 제출일시.
 */
export function SubmissionCards({
	columns,
	rows,
	pendingId,
	onTogglePaid,
}: SubmissionCardsProps) {
	const [first] = columns;
	return (
		<ul className="divide-rule divide-y md:hidden">
			{rows.map((row) => {
				const name = rowName(row, first);
				const details = detailLine(row, columns);
				return (
					<li className="space-y-1 px-4 py-3.5" key={row.id}>
						<div className="flex items-center justify-between gap-3">
							<p className="min-w-0 truncate font-semibold">
								{row.issueHeaders.length > 0 && (
									<IssueMark headers={row.issueHeaders} />
								)}
								{name}
							</p>
							<PaidToggle
								name={name}
								onToggle={onTogglePaid}
								pending={pendingId === row.id}
								row={row}
							/>
						</div>
						{details && (
							<p className="text-muted-foreground truncate text-[13px]">
								{details}
							</p>
						)}
						<p className="text-faint-foreground flex flex-wrap gap-x-2 text-xs tabular-nums">
							{row.amount !== null && (
								<span className="text-foreground font-medium">
									{formatWon(row.amount)}
								</span>
							)}
							<DateTimeText value={row.submittedAt} />
						</p>
					</li>
				);
			})}
		</ul>
	);
}
