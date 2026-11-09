import { Button } from "@jwc/ui/components/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { listOpenFormsFn } from "../features/forms/functions/public";
import { pageMeta } from "../platform/metadata";
import { PublicShell } from "../platform/ui/public-shell";

export const Route = createFileRoute("/")({
	loader: () => listOpenFormsFn(),
	head: () => ({ meta: pageMeta({ title: "행사 신청" }) }),
	component: HomePage,
});

type OpenForm = Awaited<ReturnType<typeof listOpenFormsFn>>[number];

/**
 * 공개 첫 화면 (typie 히어로 구조): 가운데 큰 제목 + 한 줄 설명 + 큰 수치(접수 중인 신청서 수),
 * 그 아래 신청서 카드 목록. 수치는 실제 목록 길이에서만 나온다.
 */
function HomePage() {
	const forms = Route.useLoaderData();
	return (
		<PublicShell width="max-w-3xl">
			<Hero openCount={forms.length} />
			{forms.length === 0 ? (
				<p className="bg-card text-muted-foreground rounded-xl border px-6 py-10 text-center">
					지금 접수 중인 신청서가 없습니다. 새 행사가 열리면 여기에 보입니다.
				</p>
			) : (
				<ul className="grid gap-3">
					{forms.map((form) => (
						<FormCard form={form} key={form.slug} />
					))}
				</ul>
			)}
		</PublicShell>
	);
}

function Hero({ openCount }: { openCount: number }) {
	return (
		<section className="flex flex-col items-center pt-10 pb-14 text-center sm:pt-16 sm:pb-20">
			<h1 className="font-display text-[34px] leading-[1.2] font-bold tracking-[-0.03em] text-balance sm:text-[52px]">
				행사 신청은 여기에서
			</h1>
			<p className="text-muted-foreground mt-4 max-w-md text-base leading-relaxed text-pretty sm:text-lg">
				죽전우리교회 청년부 행사를 골라 신청하세요. 신청 내역과 회비 안내는
				문자로 보내드립니다.
			</p>
			<div className="mt-10 flex flex-col items-center">
				<span className="font-display text-[40px] leading-none font-semibold tabular-nums">
					{openCount}
					<span className="text-muted-foreground ml-1 text-xl font-medium">
						개
					</span>
				</span>
				<span className="text-faint-foreground mt-2 text-[13px]">
					지금 접수 중인 신청서
				</span>
			</div>
		</section>
	);
}

function FormCard({ form }: { form: OpenForm }) {
	return (
		<li className="bg-card flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
			<div className="min-w-0">
				<h2 className="text-lg font-bold tracking-[-0.02em]">{form.title}</h2>
				{form.description && (
					<p className="text-muted-foreground mt-1 line-clamp-2 text-[15px]">
						{form.description}
					</p>
				)}
			</div>
			<Button
				className="h-10 shrink-0 rounded-full px-5 text-[15px] font-semibold"
				nativeButton={false}
				render={<Link params={{ slug: form.slug }} to="/f/$slug" />}
			>
				신청하기
				<ArrowRight className="size-4" />
			</Button>
		</li>
	);
}
