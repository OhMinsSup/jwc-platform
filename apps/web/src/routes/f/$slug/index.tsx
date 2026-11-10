import type { PageStep } from "@jwc/form-core/logic/visibility";
import { CenteredMessage } from "@jwc/ui-patterns/components/centered-message";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";

import { FormRunner } from "../../../features/form-engine/form-runner";
import {
	stepFromSearch,
	stepLabel,
	stepToSearch,
} from "../../../features/form-engine/steps";
import { getPublicFormFn } from "../../../features/forms/functions/public";
import { track } from "../../../platform/analytics/client";
import { pageMeta } from "../../../platform/metadata";
import {
	formPath,
	indexableHead,
	siteOriginFrom,
} from "../../../platform/search";
import {
	formStructuredData,
	jsonLdScript,
} from "../../../platform/structured-data";
import { PublicShell } from "../../../platform/ui/public-shell";

export const Route = createFileRoute("/f/$slug/")({
	validateSearch: z.object({ step: z.string().max(40).optional() }),
	loader: async ({ params }) => {
		const result = await getPublicFormFn({ data: { slug: params.slug } });
		if (!result.ok) {
			throw notFound();
		}
		return result.data;
	},
	head: ({ matches, loaderData }) => {
		const meta = pageMeta({
			title: loaderData?.definition.title ?? "신청서",
			description: loaderData?.definition.description,
		});
		// 접수 중인 폼만 검색에 노출한다. 마감·접수 전 폼은 root의 noindex를 따른다 (ADR-0023)
		if (!loaderData || loaderData.status !== "open") {
			return { meta };
		}
		const origin = siteOriginFrom(matches);
		const search = indexableHead(origin, formPath(loaderData.slug));
		const form = {
			slug: loaderData.slug,
			title: loaderData.definition.title,
			description: loaderData.definition.description ?? "",
		};
		return {
			meta: [...meta, ...search.meta],
			links: search.links,
			scripts: origin ? [jsonLdScript(formStructuredData(origin, form))] : [],
		};
	},
	component: FormPage,
});

function FormPage() {
	const { slug, status, definition } = Route.useLoaderData();
	const { step } = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const current = stepFromSearch(definition, step);
	const label = stepLabel(definition, current);
	// 화면 노출을 외부 분석 도구에 전송한다. 로더에서는 SSR·미리 불러오기도 실행된다.
	useEffect(() => {
		track("form_viewed", { formSlug: slug });
	}, [slug]);
	// 직접 접속·뒤로 가기로 표시된 단계도 기록하므로 버튼 이벤트로 옮기지 않는다.
	useEffect(() => {
		track("form_step_viewed", {
			formSlug: slug,
			step: label,
			stepCount: definition.pages.length,
		});
	}, [slug, label, definition.pages.length]);

	if (status !== "open") {
		return (
			<CenteredMessage
				description="접수 기간이 아니거나 마감되었습니다."
				title={definition.title}
			/>
		);
	}

	const onStepChange = (next: PageStep) => {
		void navigate({ search: { step: stepToSearch(next) } });
		window.scrollTo({ top: 0 });
	};

	return (
		<PublicShell>
			{/* 화면의 주제(검색 결과 제목과 같은 값)는 폼 제목 하나. 단계 제목은 그 아래 h2 */}
			<h1 className="text-muted-foreground mb-4 text-sm font-semibold">
				{definition.title}
			</h1>
			<FormRunner
				definition={definition}
				onStepChange={onStepChange}
				slug={slug}
				step={current}
			/>
		</PublicShell>
	);
}
