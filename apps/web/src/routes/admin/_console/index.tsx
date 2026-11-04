import { EmptyState } from "@jwc/ui-patterns/components/empty-state";
import { PageHeader } from "@jwc/ui-patterns/components/page-header";
import { StatGrid } from "@jwc/ui-patterns/components/stat-card";
import type { Stat } from "@jwc/ui-patterns/components/stat-card";
import { createFileRoute } from "@tanstack/react-router";
import { FilePlus2 } from "lucide-react";

import { listFormsFn } from "../../../features/forms/functions/admin";
import { CreateFormDialog } from "../../../features/forms/ui/create-form-dialog";
import { FormList } from "../../../features/forms/ui/form-list";
import type { FormSummary } from "../../../features/forms/ui/form-list";
import { formatCount } from "../../../platform/format";

export const Route = createFileRoute("/admin/_console/")({
	head: () => ({ meta: [{ title: "폼 · JWC Forms" }] }),
	loader: () => listFormsFn(),
	component: FormsPage,
});

/** 목록에서 한 번에 파생하는 요약 수치 */
function summaryStats(forms: readonly FormSummary[]): Stat[] {
	const open = forms.filter((form) => form.status === "open").length;
	const responses = forms.reduce((sum, form) => sum + form.submissionCount, 0);
	return [
		{ label: "전체 폼", value: formatCount(forms.length) },
		{
			label: "접수 중",
			value: formatCount(open),
			tone: open > 0 ? "success" : "default",
		},
		{
			label: "초안",
			value: formatCount(
				forms.filter((form) => form.status === "draft").length,
			),
		},
		{ label: "누적 응답", value: formatCount(responses), tone: "brand" },
	];
}

function FormsPage() {
	const forms = Route.useLoaderData();
	return (
		<div className="space-y-8">
			<PageHeader
				actions={<CreateFormDialog />}
				description="신청서를 만들고, 접수 상태와 응답을 관리합니다."
				title="폼"
			/>
			{forms.length === 0 ? (
				<EmptyState
					action={<CreateFormDialog />}
					description="템플릿에서 시작하면 질문, 조건, 회비, 알림 설정이 미리 채워집니다."
					icon={FilePlus2}
					title="첫 폼을 만들어보세요"
				/>
			) : (
				<>
					<StatGrid stats={summaryStats(forms)} />
					<FormList forms={forms} />
				</>
			)}
		</div>
	);
}
