import { cn } from "@jwc/ui/lib/utils";
import { Check, Loader2 } from "lucide-react";

interface SubmissionColumn {
	id: string;
	label: string;
}

export interface SubmissionRow {
	cells: Record<string, string>;
	id: string;
	paid: boolean;
	reminderCount: number;
	submittedAt: string;
	syncing: boolean;
}

interface PaidToggleProps {
	name: string;
	onToggle: (row: SubmissionRow) => void;
	pending: boolean;
	row: SubmissionRow;
}

/** 납입 상태 = 누르면 바뀌는 상태 버튼 (aria-pressed). 색 + 아이콘 + 글자로 구분 */
function PaidToggle({ row, name, pending, onToggle }: PaidToggleProps) {
	return (
		<button
			aria-label={`${name} 납입 여부`}
			aria-pressed={row.paid}
			className={cn(
				"focus-visible:ring-ring inline-flex h-7 cursor-pointer items-center gap-1 rounded-full border px-2.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60",
				row.paid
					? "bg-success-soft text-success border-transparent"
					: "text-muted-foreground hover:text-foreground border-dashed hover:border-solid",
			)}
			disabled={pending}
			onClick={() => onToggle(row)}
			type="button"
		>
			{pending ? (
				<Loader2 aria-hidden className="h-3 w-3 animate-spin" />
			) : (
				row.paid && <Check aria-hidden className="h-3 w-3" />
			)}
			{row.paid ? "납입" : "미납"}
		</button>
	);
}

interface SubmissionsTableProps {
	columns: readonly SubmissionColumn[];
	onTogglePaid: (row: SubmissionRow) => void;
	pendingId: string | null;
	rows: readonly SubmissionRow[];
}

const TH =
	"bg-muted/60 px-4 py-2.5 text-left font-medium text-muted-foreground text-xs";

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
					알림
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

/** 첫 열(이름 등)이 비어 있거나 없을 때 버튼 이름 */
const FALLBACK_ROW_NAME = "응답";

/** 납입 버튼 이름: 첫 열 값. 빈 문자열도 비어 있음으로 본다 */
function rowName(row: SubmissionRow, first: SubmissionColumn | undefined) {
	const cell = first === undefined ? undefined : row.cells[first.id];
	return cell === undefined || cell === "" ? FALLBACK_ROW_NAME : cell;
}

function Row({ row, columns, pending, onTogglePaid }: RowProps) {
	const [first] = columns;
	return (
		<tr className="hover:bg-muted/40">
			{columns.map((column, index) => (
				<td
					className={cn(
						"max-w-56 truncate px-4 py-2.5",
						index === 0 && "bg-card sticky left-0 font-medium",
					)}
					key={column.id}
				>
					{row.syncing && !row.cells[column.id] ? (
						<span className="text-muted-foreground text-xs">시트 반영 중…</span>
					) : (
						row.cells[column.id]
					)}
				</td>
			))}
			<td className="text-muted-foreground px-4 py-2.5 tabular-nums">
				{row.submittedAt.slice(0, 16)}
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
	pendingId,
	onTogglePaid,
}: SubmissionsTableProps) {
	return (
		<div className="bg-card max-h-[70vh] overflow-auto rounded-xl border shadow-xs">
			<table className="w-full text-sm whitespace-nowrap">
				<TableHead columns={columns} />
				<tbody className="divide-y">
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
	);
}
