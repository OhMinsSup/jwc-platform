import { keysOf } from "@jwc/common/object";
import type { FormDefinition } from "@jwc/form-core/definition/definition";
import { firstPageId } from "@jwc/form-core/logic/visibility";
import type { PageStep } from "@jwc/form-core/logic/visibility";
import { EmptyState } from "@jwc/ui-patterns/components/empty-state";
import { SegmentedControl } from "@jwc/ui-patterns/components/segmented-control";
import { Button } from "@jwc/ui/components/button";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Eye, RotateCcw, TriangleAlert } from "lucide-react";
import { useState } from "react";

import { FormRunner } from "../../../../../features/form-engine/form-runner";
import { getDraftPreviewFn } from "../../../../../features/forms/functions/admin";

export const Route = createFileRoute("/admin/_console/forms/$formId/preview")({
	loader: async ({ params }) => {
		const result = await getDraftPreviewFn({ data: { formId: params.formId } });
		if (!result.ok) {
			throw notFound();
		}
		return result.data;
	},
	component: PreviewPage,
});

/** 미리보기 화면 폭. 신청자는 대부분 휴대폰이므로 기본은 모바일 */
const DEVICES = {
	mobile: { label: "모바일", width: "max-w-[390px]" },
	desktop: { label: "데스크톱", width: "max-w-2xl" },
} as const;
type Device = keyof typeof DEVICES;
const DEVICE_SEGMENTS = keysOf(DEVICES).map((value) => ({
	value,
	label: DEVICES[value].label,
}));

function PreviewFrame({
	definition,
	formId,
}: {
	definition: FormDefinition;
	formId: string;
}) {
	const [device, setDevice] = useState<Device>("mobile");
	const start = (): PageStep => ({
		kind: "page",
		pageId: firstPageId(definition),
	});
	const [step, setStep] = useState<PageStep>(start);
	return (
		<div className="space-y-4">
			<div className="bg-card flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-2.5">
				<p className="text-muted-foreground flex items-center gap-2 text-sm">
					<Eye aria-hidden className="text-muted-foreground h-4 w-4" />
					저장된 초안 기준 · 실제로 제출되지 않습니다
				</p>
				<div className="flex items-center gap-2">
					<Button onClick={() => setStep(start())} size="sm" variant="ghost">
						<RotateCcw aria-hidden className="h-4 w-4" />첫 페이지로
					</Button>
					<SegmentedControl
						label="미리보기 화면 폭"
						onChange={setDevice}
						segments={DEVICE_SEGMENTS}
						value={device}
					/>
				</div>
			</div>
			<div className="bg-muted/40 rounded-2xl border p-3 sm:p-6">
				<div
					className={`bg-background mx-auto rounded-xl border p-5 transition-[max-width] sm:p-8 ${DEVICES[device].width}`}
				>
					<FormRunner
						definition={definition}
						onStepChange={setStep}
						preview
						slug={`preview:${formId}`}
						step={step}
					/>
				</div>
			</div>
		</div>
	);
}

function PreviewPage() {
	const parsed = Route.useLoaderData();
	const { formId } = Route.useParams();
	if (!parsed.ok) {
		return (
			<EmptyState
				action={
					<Button
						nativeButton={false}
						render={<Link params={{ formId }} to="/admin/forms/$formId" />}
						variant="outline"
					>
						편집 화면에서 고치기
					</Button>
				}
				description={`저장된 초안에 고칠 곳이 ${parsed.issues.length}건 있습니다.`}
				icon={TriangleAlert}
				title="아직 미리볼 수 없습니다"
			/>
		);
	}
	return <PreviewFrame definition={parsed.definition} formId={formId} />;
}
