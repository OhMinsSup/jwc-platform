import type { FormDefinition } from "@jwc/form-core/definition/definition";
import { firstPageId } from "@jwc/form-core/logic/visibility";
import type { PageStep } from "@jwc/form-core/logic/visibility";

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

/** 분석용 단계 표시: 페이지는 순서(1부터), 확인 단계는 "review" */
export function stepLabel(
	definition: FormDefinition,
	step: PageStep,
): string | number {
	if (step.kind === "review") {
		return REVIEW_STEP;
	}
	return definition.pages.findIndex((page) => page.id === step.pageId) + 1;
}
