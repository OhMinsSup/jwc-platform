import type { FormDefinition } from "@jwc/form-core";
import { blankDefinition } from "@jwc/form-core/samples";
import { Button } from "@jwc/ui/components/button";
import { createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { useCallback, useState } from "react";

import { toEditable } from "../../../../../form-builder/model/load";
import { FormBuilder } from "../../../../../form-builder/ui/form-builder";
import type { CommandOutcome } from "../../../../../form-builder/ui/form-builder";
import {
	getFormEditorFn,
	publishFormFn,
	saveDraftFn,
} from "../../../../../functions/admin";

/** 저장 후 다시 읽을 라우트: 공통 머리(제목)만. 편집기 데이터는 다시 읽지 않는다 */
const LAYOUT_ROUTE_ID = "/admin/_console/forms/$formId";

const RECOVERY_TITLE = "새 폼";

export const Route = createFileRoute("/admin/_console/forms/$formId/")({
	loader: async ({ params }) => {
		const result = await getFormEditorFn({ data: { formId: params.formId } });
		if (!result.ok) {
			throw notFound();
		}
		return result.data;
	},
	component: FormEditorPage,
});

/** 전송 문자열 → 편집 가능한 정의. JSON 문법이 깨진 경우만 따로 잡는다 */
function parseDraft(draftJson: string): FormDefinition | null {
	try {
		return toEditable(JSON.parse(draftJson));
	} catch (error) {
		if (error instanceof SyntaxError) {
			return null;
		}
		throw error;
	}
}

type LoaderData = Extract<
	Awaited<ReturnType<typeof getFormEditorFn>>,
	{ ok: true }
>["data"];

function useFormCommands(form: LoaderData) {
	const router = useRouter();
	const onSave = useCallback(
		async (definition: FormDefinition): Promise<CommandOutcome> => {
			const result = await saveDraftFn({
				data: { formId: form.id, draftJson: JSON.stringify(definition) },
			});
			if (!result.ok) {
				return { ok: false, message: result.message };
			}
			await router.invalidate({
				filter: (match) => match.routeId === LAYOUT_ROUTE_ID,
			});
			return {
				ok: true,
				message: result.data.valid
					? "초안을 저장했습니다."
					: "초안을 저장했습니다. 오류를 고쳐야 발행할 수 있습니다.",
			};
		},
		[form.id, router],
	);
	const onPublish = useCallback(async (): Promise<CommandOutcome> => {
		const result = await publishFormFn({ data: { formId: form.id } });
		await router.invalidate();
		return result.ok
			? {
					ok: true,
					message: `버전 ${result.data}을(를) 발행했습니다. 시트 탭 "${form.sheetName}"이 준비되었습니다.`,
				}
			: { ok: false, message: result.message };
	}, [form.id, form.sheetName, router]);
	return { onSave, onPublish };
}

/**
 * 폼 정의 편집기. 정의는 컴포넌트로 편집하고, 서버와는 직렬화된 정의만 주고받는다.
 * 서버(parseFormDefinition)는 여전히 최종 판정자이며 클라이언트 검증은 즉시 피드백용이다.
 */
function FormEditorPage() {
	const form = Route.useLoaderData();
	// 저장된 초안은 첫 렌더에 한 번만 읽는다. 손상되어 null이면 "빈 폼으로 시작"으로만 채운다
	const [start, setStart] = useState<FormDefinition | null>(() =>
		parseDraft(form.draftJson),
	);
	const { onSave, onPublish } = useFormCommands(form);

	return (
		<div>
			{start ? (
				<FormBuilder
					initial={start}
					lockedFieldIds={form.publishedFieldIds}
					onPublish={onPublish}
					onSave={onSave}
				/>
			) : (
				<div
					className="border-destructive/40 bg-destructive/5 space-y-3 rounded-xl border p-6"
					role="alert"
				>
					<p className="flex items-center gap-2 font-medium">
						<TriangleAlert aria-hidden className="text-destructive h-5 w-5" />
						저장된 초안의 구조가 손상되어 편집기로 열 수 없습니다.
					</p>
					<p className="text-muted-foreground text-sm">
						빈 폼으로 다시 시작할 수 있습니다. 저장하기 전까지 기존 초안은
						바뀌지 않습니다.
					</p>
					<Button
						onClick={() => setStart(blankDefinition(RECOVERY_TITLE))}
						variant="outline"
					>
						빈 폼으로 시작
					</Button>
				</div>
			)}
		</div>
	);
}
