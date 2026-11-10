import { EmptyState } from "@jwc/ui-patterns/components/empty-state";
import { PageHeader } from "@jwc/ui-patterns/components/page-header";
import { createFileRoute } from "@tanstack/react-router";
import { FilePlus2 } from "lucide-react";

import { listFormsFn } from "../../../features/forms/functions/admin";
import { CreateFormDialog } from "../../../features/forms/ui/create-form-dialog";
import { FormList } from "../../../features/forms/ui/form-list";
import type { FormSummary } from "../../../features/forms/ui/form-list";
import { BRAND_NAME } from "../../../platform/brand";
import { formatCount } from "../../../platform/format";
import { ADMIN_LOADER_STALE_TIME_MS } from "../../../platform/route-cache";

export const Route = createFileRoute("/admin/_console/")({
	head: () => ({ meta: [{ title: `폼 · ${BRAND_NAME}` }] }),
	loader: () => listFormsFn(),
	staleTime: ADMIN_LOADER_STALE_TIME_MS,
	component: FormsPage,
});

/** 제목 아래 한 줄: 지금 접수 중인 폼과 쌓인 응답 (목록에서 파생) */
function finding(forms: readonly FormSummary[]): string {
	const open = forms.filter((form) => form.status === "open");
	const responses = open.reduce((sum, form) => sum + form.submissionCount, 0);
	if (open.length === 0) {
		return "지금 접수 중인 폼이 없습니다.";
	}
	return `${formatCount(open.length)}개 폼이 접수 중이고, 응답이 ${formatCount(responses)}건 들어왔습니다.`;
}

function FormsPage() {
	const forms = Route.useLoaderData();
	return (
		<div className="space-y-8">
			<PageHeader
				actions={<CreateFormDialog />}
				description={finding(forms)}
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
				<FormList forms={forms} />
			)}
		</div>
	);
}
