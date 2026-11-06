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
	head: ({ loaderData }) => ({
		meta: [{ title: loaderData?.definition.title ?? "신청서" }],
	}),
	component: FormPage,
});

function FormPage() {
	const { slug, status, definition } = Route.useLoaderData();
	const { step } = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const current = stepFromSearch(definition, step);
	const label = stepLabel(definition, current);
	useEffect(() => {
		track("form_viewed", { formSlug: slug });
	}, [slug]);
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
			<p className="text-muted-foreground mb-4 text-sm font-semibold">
				{definition.title}
			</p>
			<FormRunner
				definition={definition}
				onStepChange={onStepChange}
				slug={slug}
				step={current}
			/>
		</PublicShell>
	);
}
