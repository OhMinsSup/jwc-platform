import { keysOf } from "@jwc/common/object";
import { CopyButton } from "@jwc/ui-patterns/components/copy-button";
import { EmptyState } from "@jwc/ui-patterns/components/empty-state";
import { SearchInput } from "@jwc/ui-patterns/components/search-input";
import { SegmentedControl } from "@jwc/ui-patterns/components/segmented-control";
import { Link } from "@tanstack/react-router";
import { ChevronRight, SearchX } from "lucide-react";
import { useMemo, useState } from "react";

import { formatCount, formatDateTime } from "../../../platform/format";
import { FORM_STATUS_META } from "../model/form-status";
import type { FormStatus } from "../model/form-status";
import { countByStatus, matchesQuery } from "../model/list-filter";
import type { StatusFilter } from "../model/list-filter";
import { FormStatusBadge } from "./form-status-badge";

export interface FormSummary {
	id: string;
	slug: string;
	status: FormStatus;
	submissionCount: number;
	title: string;
	updatedAt: number;
}

const STATUSES = keysOf(FORM_STATUS_META);

/**
 * 한 줄 = 카드 하나. 제목 링크가 카드 전체를 덮어(stretched link) 어디를 눌러도 열리고,
 * 복사 버튼만 그 위로 올라와 따로 동작한다.
 */
function FormRow({ form, origin }: { form: FormSummary; origin: string }) {
	const publicPath = `/f/${form.slug}`;
	return (
		<li className="group bg-card hover:border-brand/40 relative grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 rounded-xl border px-4 py-3.5 shadow-xs transition-colors sm:grid-cols-[minmax(0,1fr)_7rem_6rem_9rem_1.25rem] sm:px-5">
			<div className="min-w-0">
				<Link
					className="focus-visible:after:ring-ring block truncate font-semibold after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2"
					params={{ formId: form.id }}
					to="/admin/forms/$formId"
				>
					{form.title}
				</Link>
				<span className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
					<span className="truncate font-mono">{publicPath}</span>
					<CopyButton
						label={`${form.title} 신청 링크 복사`}
						text={`${origin}${publicPath}`}
					/>
				</span>
			</div>
			<FormStatusBadge
				className="justify-self-end sm:justify-self-start"
				status={form.status}
			/>
			<p className="text-sm sm:text-right">
				<span className="font-semibold tabular-nums">
					{formatCount(form.submissionCount)}
				</span>
				<span className="text-muted-foreground ml-1 text-xs">응답</span>
			</p>
			<p className="text-muted-foreground text-right text-xs tabular-nums">
				<span className="sr-only">수정 </span>
				{formatDateTime(form.updatedAt)}
			</p>
			<ChevronRight
				aria-hidden
				className="text-muted-foreground hidden h-4 w-4 transition-transform group-hover:translate-x-0.5 sm:block"
			/>
		</li>
	);
}

function ListColumns() {
	return (
		<div
			aria-hidden
			className="text-muted-foreground hidden px-5 text-xs sm:grid sm:grid-cols-[minmax(0,1fr)_7rem_6rem_9rem_1.25rem] sm:gap-x-4"
		>
			<span>제목 · 주소</span>
			<span>상태</span>
			<span className="text-right">응답</span>
			<span className="text-right">마지막 수정</span>
		</div>
	);
}

function useFormFilter(forms: readonly FormSummary[]) {
	const [query, setQuery] = useState("");
	const [status, setStatus] = useState<StatusFilter<FormStatus>>("all");
	const counts = useMemo(() => countByStatus(forms, STATUSES), [forms]);
	const visible = forms.filter(
		(f) =>
			(status === "all" || f.status === status) &&
			matchesQuery(query, f.title, f.slug),
	);
	const segments = [
		{ value: "all" as const, label: "전체", count: counts.get("all") },
		...STATUSES.map((s) => ({
			value: s,
			label: FORM_STATUS_META[s].label,
			count: counts.get(s),
		})),
	];
	return { query, setQuery, status, setStatus, visible, segments };
}

/** 검색 + 상태 필터 + 목록. 필터링은 메모리의 목록으로 (폼 수가 적은 운영 규모) */
export function FormList({ forms }: { forms: readonly FormSummary[] }) {
	const { query, setQuery, status, setStatus, visible, segments } =
		useFormFilter(forms);
	const origin = typeof window === "undefined" ? "" : window.location.origin;
	return (
		<section aria-label="폼 목록" className="space-y-3">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<SegmentedControl
					label="상태로 거르기"
					onChange={setStatus}
					segments={segments}
					value={status}
				/>
				<SearchInput
					label="제목이나 주소로 검색"
					onChange={setQuery}
					value={query}
				/>
			</div>
			{visible.length === 0 ? (
				<EmptyState
					description="검색어나 상태 필터를 바꿔보세요."
					icon={SearchX}
					title="조건에 맞는 폼이 없습니다"
				/>
			) : (
				<>
					<ListColumns />
					<ul className="space-y-2">
						{visible.map((form) => (
							<FormRow form={form} key={form.id} origin={origin} />
						))}
					</ul>
				</>
			)}
		</section>
	);
}
