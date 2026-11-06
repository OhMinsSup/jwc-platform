import type { Answers } from "../answers/value";
import type { FormDefinition, PageDef } from "../definition/definition";
import type { FieldDef } from "../definition/fields";
import { evaluateCondition } from "./conditions";

export interface VisibilityState {
	/** 숨겨진 필드의 답변을 제거한 답변 */
	answers: Answers;
	/** 표시되는 필드 id (순서 유지) */
	fieldIds: string[];
	/** 표시되는 페이지 id (순서 유지) */
	pageIds: string[];
}

function fieldIndex(definition: FormDefinition): Map<string, FieldDef> {
	return new Map(definition.fields.map((field) => [field.id, field]));
}

/**
 * 표시 상태를 한 번의 순차 패스로 계산한다.
 * 조건은 앞쪽 필드만 참조하므로(정의 무결성 규칙) 숨김이 연쇄되어도 단일 패스로 충분하다.
 */
export function resolveVisibility(
	definition: FormDefinition,
	rawAnswers: Answers,
): VisibilityState {
	const fields = fieldIndex(definition);
	const answers: Answers = {};
	const pageIds: string[] = [];
	const fieldIds: string[] = [];

	for (const page of definition.pages) {
		if (page.showIf && !evaluateCondition(page.showIf, answers)) {
			continue;
		}
		pageIds.push(page.id);
		for (const id of page.fieldIds) {
			const field = fields.get(id);
			if (
				!field ||
				(field.showIf && !evaluateCondition(field.showIf, answers))
			) {
				continue;
			}
			fieldIds.push(id);
			const value = rawAnswers[id];
			if (value !== undefined) {
				answers[id] = value;
			}
		}
	}
	return { pageIds, fieldIds, answers };
}

export function visibleFieldsOfPage(
	definition: FormDefinition,
	page: PageDef,
	answers: Answers,
): FieldDef[] {
	const { fieldIds } = resolveVisibility(definition, answers);
	const visible = new Set(fieldIds);
	const fields = fieldIndex(definition);
	return page.fieldIds
		.filter((id) => visible.has(id))
		.map((id) => fields.get(id))
		.filter((field): field is FieldDef => field !== undefined);
}

export type PageStep = { kind: "page"; pageId: string } | { kind: "review" };

/** 현재 페이지 다음 단계. 마지막 표시 페이지 다음은 확인(review) 단계. */
export function nextStep(
	definition: FormDefinition,
	answers: Answers,
	currentPageId: string,
): PageStep {
	const { pageIds } = resolveVisibility(definition, answers);
	const index = pageIds.indexOf(currentPageId);
	const next = pageIds[index + 1];
	return next ? { kind: "page", pageId: next } : { kind: "review" };
}

/** 이전 페이지. 첫 페이지면 null */
export function previousPageId(
	definition: FormDefinition,
	answers: Answers,
	current: PageStep,
): string | null {
	const { pageIds } = resolveVisibility(definition, answers);
	if (current.kind === "review") {
		return pageIds.at(-1) ?? null;
	}
	const index = pageIds.indexOf(current.pageId);
	return index > 0 ? (pageIds[index - 1] ?? null) : null;
}

export function firstPageId(definition: FormDefinition): string {
	const first =
		definition.pages.find((page) => !page.showIf) ?? definition.pages[0];
	if (!first) {
		throw new Error("폼 정의에 페이지가 없습니다");
	}
	return first.id;
}
