import { EmptyState } from "@jwc/ui-patterns/components/empty-state";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarX } from "lucide-react";

import { listOpenFormsFn } from "../features/forms/functions/public";
import { pageMeta } from "../platform/metadata";
import { PublicShell } from "../platform/ui/public-shell";

/** 메신저 공유 미리보기·설명 메타용 문장. 검색 노출은 root의 noindex를 따른다 (ADR-0015) */
const HOME_DESCRIPTION =
	"지금 접수 중인 신청서를 모았습니다. 신청서를 골라 신청하면 신청 내역과 안내를 문자로 보내드립니다.";
const LIST_HEADING_ID = "open-forms-heading";

export const Route = createFileRoute("/")({
	loader: () => listOpenFormsFn(),
	head: () => ({
		meta: pageMeta({ title: "신청서 목록", description: HOME_DESCRIPTION }),
	}),
	component: HomePage,
});

type OpenForm = Awaited<ReturnType<typeof listOpenFormsFn>>[number];

/**
 * 공개 첫 화면: 짧은 소개 → "접수 중인 신청서" 목록. 목록이 첫 화면 안에 보이도록 소개는 낮게 둔다.
 * 개수는 실제 목록 길이에서만 나온다.
 */
function HomePage() {
	const forms = Route.useLoaderData();
	return (
		<PublicShell width="max-w-3xl">
			<Intro />
			<section aria-labelledby={LIST_HEADING_ID} className="mt-10 sm:mt-14">
				<div className="mb-3 flex items-baseline justify-between px-1">
					<h2 className="text-[15px] font-semibold" id={LIST_HEADING_ID}>
						접수 중인 신청서
					</h2>
					<span className="text-faint-foreground text-[13px] tabular-nums">
						{forms.length}개
					</span>
				</div>
				{forms.length === 0 ? (
					<EmptyState
						description="새 행사가 열리면 여기에 보입니다."
						icon={CalendarX}
						title="지금 접수 중인 신청서가 없습니다"
					/>
				) : (
					<ul className="grid gap-3">
						{forms.map((form) => (
							<FormCard form={form} key={form.slug} />
						))}
					</ul>
				)}
			</section>
		</PublicShell>
	);
}

function Intro() {
	return (
		<section className="flex flex-col items-center pt-6 text-center sm:pt-12">
			<h1 className="font-display text-[32px] leading-[1.2] font-bold tracking-[-0.03em] text-balance sm:text-[44px]">
				신청은 여기에서
			</h1>
			<p className="text-muted-foreground mt-3 max-w-md text-base leading-relaxed text-pretty sm:mt-4 sm:text-lg">
				접수 중인 신청서를 골라 신청하세요. 신청 내역과 안내는 문자로
				보내드립니다.
			</p>
		</section>
	);
}

/**
 * 카드 전체가 눌리는 자리. 링크는 제목 하나에만 두고 after로 카드 전체를 덮는다
 * (화면 낭독기에는 "제목" 링크 하나로 읽힌다). "신청하기"는 보이는 단서일 뿐이라 숨긴다.
 * 설명은 날짜·장소를 복사할 수 있도록 덮개 위(relative z-10)에 둔다. 설명 위를 누르면 이동하지 않는다.
 */
function FormCard({ form }: { form: OpenForm }) {
	return (
		<li className="group bg-card hover:border-border-strong relative flex flex-col gap-4 rounded-xl border p-5 transition-colors sm:flex-row sm:items-center sm:justify-between sm:p-6">
			<div className="min-w-0">
				<h3 className="text-lg font-bold tracking-[-0.02em]">
					<Link
						className="focus-visible:after:ring-ring after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2"
						params={{ slug: form.slug }}
						to="/f/$slug"
					>
						{form.title}
					</Link>
				</h3>
				{form.description && (
					<p className="text-muted-foreground relative z-10 mt-1 line-clamp-2 text-[15px]">
						{form.description}
					</p>
				)}
			</div>
			<span
				aria-hidden
				className="bg-primary text-primary-foreground inline-flex h-10 shrink-0 items-center gap-1.5 self-start rounded-full px-5 text-[15px] font-semibold sm:self-auto"
			>
				신청하기
				<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
			</span>
		</li>
	);
}
