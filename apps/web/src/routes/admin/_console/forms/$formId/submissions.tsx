import { keysOf } from "@jwc/common/object";
import { EmptyState } from "@jwc/ui-patterns/components/empty-state";
import { SearchInput } from "@jwc/ui-patterns/components/search-input";
import { SegmentedControl } from "@jwc/ui-patterns/components/segmented-control";
import { StatGrid } from "@jwc/ui-patterns/components/stat-card";
import type { Stat } from "@jwc/ui-patterns/components/stat-card";
import { createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { Inbox, SearchX } from "lucide-react";
import { useState } from "react";

import { matchesQuery } from "../../../../../features/forms/model/list-filter";
import {
	listSubmissionsFn,
	markPaidFn,
} from "../../../../../features/submissions/functions";
import { SubmissionsTable } from "../../../../../features/submissions/ui/submissions-table";
import type { SubmissionRow } from "../../../../../features/submissions/ui/submissions-table";
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

const PERCENT = 100;

function submissionStats(rows: readonly SubmissionRow[]): Stat[] {
	const paid = rows.filter((row) => row.paid).length;
	const rate =
		rows.length === 0 ? 0 : Math.round((paid / rows.length) * PERCENT);
	return [
		{ label: "응답", value: formatCount(rows.length), tone: "brand" },
		{ label: "납입 완료", value: formatCount(paid), tone: "success" },
		{
			label: "미납",
			value: formatCount(rows.length - paid),
			tone: rows.length - paid > 0 ? "warning" : "default",
		},
		{
			label: "납입률",
			value: `${rate}%`,
			hint: "미납자에게는 정해진 간격으로 알림이 갑니다",
		},
	];
}

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
	const segments = keysOf(PAID_FILTERS).map((value) => ({
		value,
		label: PAID_FILTERS[value].label,
		count: rows.filter(PAID_FILTERS[value].test).length,
	}));
	return { filter, setFilter, query, setQuery, visible, segments };
}

function SheetNote() {
	return (
		<p className="text-muted-foreground text-xs">
			질문 일부만 보여줍니다. 전체 답변은 위쪽 “응답 시트”에서 확인하세요. 납입
			여부는 시트에도 바로 반영됩니다.
		</p>
	);
}

function ErrorText({ message }: { message: string | null }) {
	return message ? (
		<p className="text-destructive text-sm" role="alert">
			{message}
		</p>
	) : null;
}

function SubmissionsPage() {
	const { columns, rows } = Route.useLoaderData();
	const { pendingId, error, toggle } = usePaidToggle();
	const { filter, setFilter, query, setQuery, visible, segments } =
		useSubmissionFilter(rows);
	if (rows.length === 0) {
		return (
			<EmptyState
				description="신청 링크를 공유하면 응답이 여기에 쌓입니다."
				icon={Inbox}
				title="아직 응답이 없습니다"
			/>
		);
	}
	return (
		<div className="space-y-6">
			<StatGrid stats={submissionStats(rows)} />
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<SegmentedControl
					label="납입 상태로 거르기"
					onChange={setFilter}
					segments={segments}
					value={filter}
				/>
				<SearchInput
					label="이름, 연락처 등으로 검색"
					onChange={setQuery}
					value={query}
				/>
			</div>
			<ErrorText message={error} />
			{visible.length === 0 ? (
				<EmptyState
					description="필터나 검색어를 바꿔보세요."
					icon={SearchX}
					title="조건에 맞는 응답이 없습니다"
				/>
			) : (
				<SubmissionsTable
					columns={columns}
					onTogglePaid={toggle}
					pendingId={pendingId}
					rows={visible}
				/>
			)}
			<SheetNote />
		</div>
	);
}
