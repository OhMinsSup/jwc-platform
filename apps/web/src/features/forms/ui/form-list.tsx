import { keysOf } from "@jwc/common/object";
import { CopyButton } from "@jwc/ui-patterns/components/copy-button";
import { CountFilter } from "@jwc/ui-patterns/components/count-filter";
import { SearchInput } from "@jwc/ui-patterns/components/search-input";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { formatCount } from "../../../platform/format";
import { DateTimeText } from "../../../platform/ui/date-time-text";
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

/** 열 배치: 제목·주소가 가장 넓고, 숫자 열은 오른쪽 정렬 */
const ROW_GRID =
	"sm:grid-cols-[minmax(0,1fr)_6.5rem_5rem_9.5rem_1rem] sm:gap-x-6";

/**
 * 한 줄 = 폼 하나 (카드 하나 안에서 행 구분선으로 나눈다).
 * 제목 링크가 행 전체를 덮어(stretched link) 어디를 눌러도 열리고, 복사 버튼만 그 위로 올라와 따로 동작한다.
 */
function FormRow({ form, origin }: { form: FormSummary; origin: string }) {
	const publicPath = `/f/${form.slug}`;
	return (
		<li
			className={`group hover:bg-muted/70 relative grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-3.5 transition-colors ${ROW_GRID}`}
		>
			<div className="min-w-0">
				<Link
					className="focus-visible:after:ring-ring block truncate font-semibold after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset"
					params={{ formId: form.id }}
					to="/admin/forms/$formId"
				>
					{form.title}
				</Link>
				<span className="text-muted-foreground mt-0.5 flex items-center gap-1 text-[13px]">
					<span className="truncate">{publicPath}</span>
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
			<p className="text-sm tabular-nums sm:text-right">
				<span className="font-semibold">
					{formatCount(form.submissionCount)}
				</span>
				<span className="text-muted-foreground ml-0.5">건</span>
			</p>
			<p className="text-muted-foreground text-right text-[13px] tabular-nums">
				<span className="sr-only">마지막 수정 </span>
				<DateTimeText value={form.updatedAt} />
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
			className={`text-muted-foreground hidden border-b px-5 py-2.5 text-xs sm:grid ${ROW_GRID}`}
		>
			<span>제목 · 신청 주소</span>
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
	const options = [
		{ value: "all" as const, label: "전체", count: counts.get("all") },
		...STATUSES.map((s) => ({
			value: s,
			label: FORM_STATUS_META[s].label,
			count: counts.get(s),
		})),
	];
	return { query, setQuery, status, setStatus, visible, options };
}

/** 개수 카드(= 상태 거르개) + 검색 + 목록. 필터링은 메모리의 목록으로 (폼 수가 적은 운영 규모) */
export function FormList({ forms }: { forms: readonly FormSummary[] }) {
	const { query, setQuery, status, setStatus, visible, options } =
		useFormFilter(forms);
	const origin = typeof window === "undefined" ? "" : window.location.origin;
	return (
		<section aria-label="폼 목록" className="space-y-4">
			<CountFilter
				label="상태로 거르기"
				onChange={setStatus}
				options={options}
				value={status}
			/>
			<div className="bg-card rounded-xl border">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
					<h2 className="text-base font-semibold">
						{status === "all"
							? "모든 폼"
							: `${FORM_STATUS_META[status].label} 폼`}
						<span className="text-muted-foreground ml-1.5 font-normal tabular-nums">
							{formatCount(visible.length)}
						</span>
					</h2>
					<SearchInput
						label="제목이나 주소로 검색"
						onChange={setQuery}
						value={query}
					/>
				</div>
				{visible.length === 0 ? (
					<p className="text-muted-foreground px-5 py-8 text-center text-sm">
						조건에 맞는 폼이 없습니다. 검색어나 상태를 바꿔보세요.
					</p>
				) : (
					<>
						<ListColumns />
						<ul className="divide-rule divide-y">
							{visible.map((form) => (
								<FormRow form={form} key={form.id} origin={origin} />
							))}
						</ul>
					</>
				)}
			</div>
		</section>
	);
}
