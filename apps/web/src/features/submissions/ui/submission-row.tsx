import { cn } from "@jwc/ui/lib/utils";
import { Check, Loader2, TriangleAlert } from "lucide-react";

/** 응답 표/카드가 함께 쓰는 행 모델과 작은 조각 (납입 버튼, 이름, 시트 값 확인 표시) */

export interface SubmissionColumn {
	id: string;
	label: string;
}

export interface SubmissionRow {
	/** 이 응답의 회비 (회비 설정이 없거나 옵션 미선택이면 null) */
	amount: number | null;
	cells: Record<string, string>;
	/** 옵션별 금액일 때 고른 옵션 이름 */
	group: string | null;
	id: string;
	/** 시트에서 해석하지 못한 값이 있는 컬럼 이름 (운영자가 시트를 잘못 고친 경우) */
	issueHeaders: string[];
	paid: boolean;
	reminderCount: number;
	submittedAt: string;
}

interface PaidToggleProps {
	name: string;
	onToggle: (row: SubmissionRow) => void;
	pending: boolean;
	row: SubmissionRow;
}

/** 납입 상태 = 누르면 바뀌는 상태 버튼 (aria-pressed). 색 + 아이콘 + 글자로 구분 */
export function PaidToggle({ row, name, pending, onToggle }: PaidToggleProps) {
	return (
		<button
			aria-label={`${name} 납입 여부`}
			aria-pressed={row.paid}
			className={cn(
				"focus-visible:ring-ring inline-flex h-7 flex-none cursor-pointer items-center gap-1 rounded-full border px-2.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60",
				row.paid
					? "bg-success-soft text-success-ink border-transparent"
					: "border-input text-foreground hover:border-foreground/40 border-dashed",
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

/** 첫 열(이름 등)이 비어 있거나 없을 때 버튼 이름 */
const FALLBACK_ROW_NAME = "응답";

/** 납입 버튼 이름: 첫 열 값. 빈 문자열도 비어 있음으로 본다 */
export function rowName(
	row: SubmissionRow,
	first: SubmissionColumn | undefined,
) {
	const cell = first === undefined ? undefined : row.cells[first.id];
	return cell === undefined || cell === "" ? FALLBACK_ROW_NAME : cell;
}

/** 시트 값 확인 필요 표시. 아이콘 + 화면 낭독기용 문장 + 툴팁 */
export function IssueMark({ headers }: { headers: readonly string[] }) {
	const label = `시트 값 확인 필요: ${headers.join(", ")}`;
	return (
		<span className="text-warning mr-1 inline-flex align-[-2px]" title={label}>
			<TriangleAlert aria-hidden className="h-3.5 w-3.5" />
			<span className="sr-only">{label}</span>
		</span>
	);
}
