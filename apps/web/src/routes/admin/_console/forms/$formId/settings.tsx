import { createFileRoute, notFound } from "@tanstack/react-router";

import { getSheetSettingsFn } from "../../../../../features/forms/functions/admin";
import { SheetSettingsForm } from "../../../../../features/forms/ui/sheet-settings-form";

/** 폼 설정: 응답을 저장할 스프레드시트와 탭 */
export const Route = createFileRoute("/admin/_console/forms/$formId/settings")({
	loader: async ({ params }) => {
		const result = await getSheetSettingsFn({
			data: { formId: params.formId },
		});
		if (!result.ok) {
			throw notFound();
		}
		return result.data;
	},
	component: SettingsPage,
});

function SettingsPage() {
	return <SheetSettingsForm settings={Route.useLoaderData()} />;
}
