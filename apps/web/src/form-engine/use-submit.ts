import type { Answers, FormDefinition, PageStep } from "@jwc/form-core";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { submitFormFn } from "../functions/public";
import { useDraftStore } from "./store";

/** 서버가 돌려준 필드 오류가 있으면 그 필드가 속한 페이지로 되돌린다 */
function pageOfFirstError(
	definition: FormDefinition,
	fieldErrors: Record<string, string>,
): PageStep {
	const failed = Object.keys(fieldErrors);
	const page = definition.pages.find((p) =>
		p.fieldIds.some((id) => failed.includes(id)),
	);
	return page ? { kind: "page", pageId: page.id } : { kind: "review" };
}

export function useSubmit(
	slug: string,
	definition: FormDefinition,
	onFieldErrors: (step: PageStep, errors: Record<string, string>) => void,
) {
	const navigate = useNavigate();
	const clear = useDraftStore((state) => state.clear);
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	/** 제출 한 번: 실패면 오류 표시(+해당 페이지로), 성공이면 초안을 지우고 완료 화면으로 */
	async function submitOnce(answers: Answers) {
		const result = await submitFormFn({ data: { slug, answers } });
		if (!result.ok) {
			setError(result.message);
			if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
				onFieldErrors(
					pageOfFirstError(definition, result.fieldErrors),
					result.fieldErrors,
				);
			}
			return;
		}
		clear(slug);
		await navigate({
			to: "/f/$slug/done",
			params: { slug },
			search: { id: result.data.submissionId, updated: !result.data.isNew },
		});
	}

	// catch가 모든 오류를 받으므로 pending 해제는 항상 실행된다 (React Compiler가 finally를 지원하지 않는다)
	async function run(answers: Answers) {
		setPending(true);
		setError(null);
		try {
			await submitOnce(answers);
		} catch {
			setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
		}
		setPending(false);
	}

	return { run, pending, error };
}
