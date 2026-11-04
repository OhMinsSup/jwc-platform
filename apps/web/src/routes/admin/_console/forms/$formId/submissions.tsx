import { keysOf } from "@jwc/common/object";
import { CountFilter } from "@jwc/ui-patterns/components/count-filter";
import { EmptyState } from "@jwc/ui-patterns/components/empty-state";
import { SearchInput } from "@jwc/ui-patterns/components/search-input";
import { createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { Inbox } from "lucide-react";
import { useState } from "react";

import { matchesQuery } from "../../../../../features/forms/model/list-filter";
import {
	listSubmissionsFn,
	markPaidFn,
} from "../../../../../features/submissions/functions";
import { summarizePayment } from "../../../../../features/submissions/model/payment";
import { PaymentTrack } from "../../../../../features/submissions/ui/payment-track";
import type { SubmissionRow } from "../../../../../features/submissions/ui/submission-row";
import { SubmissionsTable } from "../../../../../features/submissions/ui/submissions-table";
import { formatCount } from "../../../../../platform/format";

export const Route = createFileRoute(
	"/admin/_console/forms/$formId/submissions",
)({
	loader: async ({ params }) => {
		const result = await listSubmissionsFn({ data: { formId: params.formId } });
		if (!result.ok) {
			throw notFound();
		}
		return result.data;
	},
	component: SubmissionsPage,
});

/** 납입 필터 → 행 조건. 필터가 늘면 이 표에 한 줄 추가 */
const PAID_FILTERS = {
	all: { label: "전체", test: () => true },
	unpaid: { label: "미납", test: (row: SubmissionRow) => !row.paid },
	paid: { label: "납입", test: (row: SubmissionRow) => row.paid },
} as const;
type PaidFilter = keyof typeof PAID_FILTERS;

/** 납입 토글 → D1 반영 + 시트 갱신 요청 → 목록 다시 읽기 */
function usePaidToggle() {
	const router = useRouter();
	const [pendingId, setPendingId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const toggle = async (row: SubmissionRow) => {
		setPendingId(row.id);
		const result = await markPaidFn({
			data: { submissionId: row.id, paid: !row.paid },
		});
		setError(result.ok ? null : result.message);
		await router.invalidate();
		setPendingId(null);
	};
	return { pendingId, error, toggle };
}

/** 필터 + 검색 상태와 그 결과(보이는 행, 개수)를 한 곳에서 파생 */
function useSubmissionFilter(rows: readonly SubmissionRow[]) {
	const [filter, setFilter] = useState<PaidFilter>("all");
	const [query, setQuery] = useState("");
	const visible = rows.filter(
		(row) =>
			PAID_FILTERS[filter].test(row) &&
			matchesQuery(query, ...Object.values(row.cells)),
	);
	const options = keysOf(PAID_FILTERS).map((value) => ({
		value,
		label: PAID_FILTERS[value].label,
		count: rows.filter(PAID_FILTERS[value].test).length,
	}));
	return { filter, setFilter, query, setQuery, visible, options };
}

function SheetNote() {
	return (
		<p className="text-muted-foreground text-[13px]">
			질문 일부만 보여줍니다. 전체 답변은 위쪽 “응답 시트”에서 확인하세요. 납입
			여부를 바꾸면 시트에도 바로 반영됩니다.
		</p>
	);
}

/** 표 머리줄: 지금 보이는 응답 수 + 검색 */
function TableHeader({
	title,
	count,
	query,
	onQuery,
}: {
	title: string;
	count: number;
	query: string;
	onQuery: (value: string) => void;
}) {
	return (
		<div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
			<h2 className="text-base font-semibold">
				{title}
				<span className="text-muted-foreground ml-1.5 font-normal tabular-nums">
					{formatCount(count)}
				</span>
			</h2>
			<SearchInput
				label="이름, 연락처 등으로 검색"
				onChange={onQuery}
				value={query}
			/>
		</div>
	);
}

function ErrorText({ message }: { message: string | null }) {
	return message ? (
		<p className="text-destructive text-sm" role="alert">
			{message}
		</p>
	) : null;
}

function NoSubmissions() {
	return (
		<EmptyState
			description="신청 링크를 공유하면 응답이 여기에 쌓입니다."
			icon={Inbox}
			title="아직 응답이 없습니다"
		/>
	);
}

/** 거르기/검색 결과가 비었을 때 다음 할 일 */
function NoMatchNote() {
	return (
		<p className="text-muted-foreground text-sm">
			조건에 맞는 응답이 없습니다. 필터나 검색어를 바꿔보세요.
		</p>
	);
}

function SubmissionsPage() {
	const { columns, rows, payment } = Route.useLoaderData();
	const { pendingId, error, toggle } = usePaidToggle();
	const { filter, setFilter, query, setQuery, visible, options } =
		useSubmissionFilter(rows);
	if (rows.length === 0) {
		return <NoSubmissions />;
	}
	return (
		<div className="space-y-6">
			{payment && (
				<PaymentTrack
					account={payment.account}
					groupLabel={payment.groupLabel}
					onShowUnpaid={() => setFilter("unpaid")}
					reminder={payment.reminder}
					summary={summarizePayment(rows)}
				/>
			)}
			<CountFilter
				label="납입 상태로 거르기"
				onChange={setFilter}
				options={options}
				value={filter}
			/>
			<ErrorText message={error} />
			<SubmissionsTable
				columns={columns}
				header={
					<TableHeader
						count={visible.length}
						onQuery={setQuery}
						query={query}
						title={`${PAID_FILTERS[filter].label} 응답`}
					/>
				}
				onTogglePaid={toggle}
				pendingId={pendingId}
				rows={visible}
			/>
			{visible.length === 0 && <NoMatchNote />}
			<SheetNote />
		</div>
	);
}
