import { firstPageId } from "@jwc/form-core";
import type { FormDefinition, PageStep } from "@jwc/form-core";

const REVIEW_STEP = "review";

/** URL 검색 파라미터 ↔ 단계. 알 수 없는 값이면 첫 페이지로. */
export function stepFromSearch(
	definition: FormDefinition,
	step: string | undefined,
): PageStep {
	if (step === REVIEW_STEP) {
		return { kind: "review" };
	}
	const page = definition.pages.find((p) => p.id === step);
	return { kind: "page", pageId: page?.id ?? firstPageId(definition) };
}

export function stepToSearch(step: PageStep): string {
	return step.kind === "review" ? REVIEW_STEP : step.pageId;
}
