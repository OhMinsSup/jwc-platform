import { StatusBadge } from "@jwc/ui-patterns/components/status-badge";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect } from "react";

import { getSubmissionViewFn } from "../../features/submissions/functions";
import { track } from "../../platform/analytics/client";
import { PublicShell } from "../../platform/ui/public-shell";

export const Route = createFileRoute("/r/$id")({
	loader: async ({ params }) => {
		const result = await getSubmissionViewFn({ data: { id: params.id } });
		if (!result.ok) {
			throw notFound();
		}
		return result.data;
	},
	head: ({ loaderData }) => ({
		meta: [{ title: `신청 내역 - ${loaderData?.formTitle ?? ""}` }],
	}),
	component: SubmissionPage,
});

/** 납입 상태 → 배지. 초록은 확인된 납입에만, 대기는 주의색 (색 + 글자) */
const PAYMENT_BADGE = {
	paid: {
		label: "입금 확인",
		badgeClass: "bg-success-soft text-success-ink",
		dotClass: "bg-success",
	},
	unpaid: {
		label: "입금 대기",
		badgeClass: "bg-warning-soft text-warning",
		dotClass: "bg-warning",
	},
} as const;

/** 답변 목록 (저장소에 저장된 뒤에만 이 화면에 온다) */
function AnswerList({
	items,
}: {
	items: readonly { label: string; value: string }[];
}) {
	return (
		<dl className="bg-card divide-rule divide-y rounded-xl border px-5">
			{items.map((item) => (
				<div
					className="flex justify-between gap-4 py-3.5 text-[15px]"
					key={item.label}
				>
					<dt className="text-muted-foreground">{item.label}</dt>
					<dd className="text-right font-medium whitespace-pre-line">
						{item.value}
					</dd>
				</div>
			))}
		</dl>
	);
}

function SubmissionPage() {
	const view = Route.useLoaderData();
	useEffect(() => {
		track("submission_viewed");
	}, []);
	return (
		<PublicShell>
			<div className="mb-6 flex items-start justify-between gap-4">
				<div>
					<p className="text-muted-foreground text-sm font-semibold">
						{view.formTitle}
					</p>
					<h1 className="font-display mt-1 text-[28px] leading-tight font-bold tracking-[-0.03em]">
						신청 내역
					</h1>
					<p className="text-faint-foreground mt-2 text-[13px] tabular-nums">
						신청일시 {view.submittedAt}
					</p>
				</div>
				{view.amount !== null && (
					<StatusBadge {...PAYMENT_BADGE[view.paid ? "paid" : "unpaid"]} />
				)}
			</div>

			<AnswerList items={view.items} />

			{view.amount !== null && !view.paid && (
				<section className="bg-raised mt-4 rounded-xl p-5 text-[15px]">
					<p className="flex items-baseline justify-between">
						<span className="text-muted-foreground">납부 금액</span>
						<strong className="text-lg font-bold tabular-nums">
							{view.amount.toLocaleString("ko-KR")}원
						</strong>
					</p>
					{view.account && (
						<p className="mt-2 font-semibold tabular-nums">{view.account}</p>
					)}
				</section>
			)}
		</PublicShell>
	);
}
