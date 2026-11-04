import type { PageStep } from "@jwc/form-core";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { CenteredMessage } from "../../../components/route-states";
import { PublicShell } from "../../../components/shell";
import { FormRunner } from "../../../form-engine/form-runner";
import { stepFromSearch, stepToSearch } from "../../../form-engine/steps";
import { getPublicFormFn } from "../../../functions/public";

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
			<p className="text-primary mb-6 text-sm font-medium">
				{definition.title}
			</p>
			<FormRunner
				definition={definition}
				onStepChange={onStepChange}
				slug={slug}
				step={stepFromSearch(definition, step)}
			/>
		</PublicShell>
	);
}
