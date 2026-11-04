import { Badge } from "@jwc/ui/components/badge";
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

/** 답변 목록 (저장소에 저장된 뒤에만 이 화면에 온다) */
function AnswerList({
	items,
}: {
	items: readonly { label: string; value: string }[];
}) {
	return (
		<dl className="divide-y rounded-xl border px-5">
			{items.map((item) => (
				<div
					className="flex justify-between gap-4 py-3 text-sm"
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
					<p className="text-muted-foreground text-sm">{view.formTitle}</p>
					<h1 className="text-2xl font-bold">신청 내역</h1>
					<p className="text-muted-foreground mt-1 text-xs">
						신청일시 {view.submittedAt}
					</p>
				</div>
				{view.amount !== null && (
					<Badge variant={view.paid ? "default" : "secondary"}>
						{view.paid ? "입금 확인" : "입금 대기"}
					</Badge>
				)}
			</div>

			<AnswerList items={view.items} />

			{view.amount !== null && !view.paid && (
				<section className="bg-muted/30 mt-6 rounded-xl border p-5 text-sm">
					<p>
						납부 금액{" "}
						<strong className="ml-2">
							{view.amount.toLocaleString("ko-KR")}원
						</strong>
					</p>
					{view.account && <p className="mt-2 font-mono">{view.account}</p>}
				</section>
			)}
		</PublicShell>
	);
}
