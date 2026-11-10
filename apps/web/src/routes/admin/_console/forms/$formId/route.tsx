import { CopyButton } from "@jwc/ui-patterns/components/copy-button";
import { PageHeader } from "@jwc/ui-patterns/components/page-header";
import { Button } from "@jwc/ui/components/button";
import {
	createFileRoute,
	Link,
	notFound,
	Outlet,
	useRouter,
} from "@tanstack/react-router";
import { ChevronRight, ExternalLink, Loader2, Sheet } from "lucide-react";
import { useState } from "react";

import {
	getFormSummaryFn,
	setFormStatusFn,
} from "../../../../../features/forms/functions/admin";
import { FormStatusBadge } from "../../../../../features/forms/ui/form-status-badge";
import { FormTabs } from "../../../../../features/forms/ui/form-tabs";
import { BRAND_NAME } from "../../../../../platform/brand";
import { ADMIN_LOADER_STALE_TIME_MS } from "../../../../../platform/route-cache";

/** 폼 안의 모든 화면(편집/미리보기/응답)이 공유하는 머리: 위치, 상태, 폼 단위 동작, 탭 */
export const Route = createFileRoute("/admin/_console/forms/$formId")({
	loader: async ({ params }) => {
		const result = await getFormSummaryFn({ data: { formId: params.formId } });
		if (!result.ok) {
			throw notFound();
		}
		return result.data;
	},
	staleTime: ADMIN_LOADER_STALE_TIME_MS,
	head: ({ loaderData }) => ({
		meta: [{ title: `${loaderData?.title ?? "폼"} · ${BRAND_NAME}` }],
	}),
	component: FormLayout,
});

type Summary = Extract<
	Awaited<ReturnType<typeof getFormSummaryFn>>,
	{ ok: true }
>["data"];

function Breadcrumb({ title }: { title: string }) {
	return (
		<nav aria-label="현재 위치">
			<ol className="text-muted-foreground flex items-center gap-1 text-sm">
				<li>
					<Link className="hover:text-foreground" to="/admin">
						폼
					</Link>
				</li>
				<ChevronRight aria-hidden className="h-3.5 w-3.5" />
				<li aria-current="page" className="text-foreground max-w-64 truncate">
					{title}
				</li>
			</ol>
		</nav>
	);
}

/** 접수 열기/마감. 상태가 바뀌면 레이아웃 데이터를 다시 읽는다 */
function StatusToggle({ form }: { form: Summary }) {
	const router = useRouter();
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const next = form.status === "open" ? "closed" : "open";
	const toggle = async () => {
		setPending(true);
		const result = await setFormStatusFn({
			data: { formId: form.id, status: next },
		});
		setError(result.ok ? null : result.message);
		await router.invalidate();
		setPending(false);
	};
	return (
		<>
			<Button
				disabled={pending}
				onClick={toggle}
				size="sm"
				variant={next === "closed" ? "outline" : "default"}
			>
				{pending && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
				{next === "closed" ? "접수 마감하기" : "접수 다시 열기"}
			</Button>
			{error && (
				<p className="text-destructive w-full text-sm" role="alert">
					{error}
				</p>
			)}
		</>
	);
}

function PublicLink({ slug }: { slug: string }) {
	const path = `/f/${slug}`;
	const origin = typeof window === "undefined" ? "" : window.location.origin;
	return (
		<span className="inline-flex items-center gap-1">
			<a
				className="hover:text-foreground hover:underline"
				href={path}
				rel="noreferrer"
				target="_blank"
			>
				{path}
				<span className="sr-only">(신청 화면, 새 창)</span>
			</a>
			<CopyButton label="신청 링크 복사" text={`${origin}${path}`} />
		</span>
	);
}

function FormLayout() {
	const form = Route.useLoaderData();
	return (
		<div className="space-y-6">
			<PageHeader
				actions={
					<>
						<Button
							nativeButton={false}
							render={
								// oxlint-disable-next-line jsx-a11y/control-has-associated-label -- 글자("응답 시트")는 Button 자식으로 이 a 안에 렌더된다(render 병합)
								<a
									href={form.spreadsheetUrl}
									rel="noreferrer"
									target="_blank"
								/>
							}
							size="sm"
							variant="outline"
						>
							<Sheet aria-hidden className="h-4 w-4" />
							응답 시트
							<ExternalLink aria-hidden className="h-3 w-3 opacity-60" />
							<span className="sr-only">(새 창)</span>
						</Button>
						{form.published && <StatusToggle form={form} />}
					</>
				}
				description={
					<span className="flex flex-wrap items-center gap-x-3 gap-y-1">
						<FormStatusBadge status={form.status} />
						<PublicLink slug={form.slug} />
					</span>
				}
				eyebrow={<Breadcrumb title={form.title} />}
				title={form.title}
			>
				<FormTabs formId={form.id} published={form.published} />
			</PageHeader>
			<Outlet />
		</div>
	);
}
