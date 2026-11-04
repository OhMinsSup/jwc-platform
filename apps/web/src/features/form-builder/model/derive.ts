import type { FormDefinition } from "@jwc/form-core/definition/definition";
import type { FieldDef, FieldType } from "@jwc/form-core/definition/fields";

import { isConditionSource } from "./conditions";

/**
 * 정의에서 한 번에 계산하는 조회용 인덱스.
 * 컴포넌트마다 find/filter를 반복하지 않고, 상태가 바뀔 때 한 번만 만든다 (O(n)).
 */
export interface EditorIndex {
	byId: ReadonlyMap<string, FieldDef>;
	/** 표시 순서 (페이지 순 → 페이지 안 순서) */
	ordered: readonly FieldDef[];
	orderOf: ReadonlyMap<string, number>;
	pageIndexOf: ReadonlyMap<string, number>;
	/** 어느 페이지에도 없는 질문 (과거 JSON 편집으로 생길 수 있음) */
	unplaced: readonly FieldDef[];
}

export function buildIndex(definition: FormDefinition): EditorIndex {
	const byId = new Map(definition.fields.map((field) => [field.id, field]));
	const ordered: FieldDef[] = [];
	const orderOf = new Map<string, number>();
	const pageIndexOf = new Map<string, number>();
	for (const [pageIndex, page] of definition.pages.entries()) {
		for (const id of page.fieldIds) {
			const field = byId.get(id);
			if (field && !orderOf.has(id)) {
				orderOf.set(id, ordered.length);
				pageIndexOf.set(id, pageIndex);
				ordered.push(field);
			}
		}
	}
	const unplaced = definition.fields.filter((field) => !orderOf.has(field.id));
	return { byId, ordered, orderOf, pageIndexOf, unplaced };
}

/** 질문 조건에 쓸 수 있는 후보: 자기보다 앞에 표시되는 답변형 질문 */
export function fieldConditionSources(
	index: EditorIndex,
	fieldId: string,
): FieldDef[] {
	const self = index.orderOf.get(fieldId) ?? index.ordered.length;
	return index.ordered.slice(0, self).filter(isConditionSource);
}

/** 페이지 조건 후보: 이전 페이지들의 답변형 질문 */
export function pageConditionSources(
	index: EditorIndex,
	pageIndex: number,
): FieldDef[] {
	return index.ordered.filter(
		(field) =>
			(index.pageIndexOf.get(field.id) ?? pageIndex) < pageIndex &&
			isConditionSource(field),
	);
}

export interface MoveTarget {
	index: number;
	pageId: string;
}

/**
 * 위/아래 이동 목적지. 페이지 경계에서는 이웃 페이지로 넘어간다
 * (드래그 없이 키보드/버튼만으로 모든 위치에 갈 수 있게).
 */
export function moveTarget(
	definition: FormDefinition,
	fieldId: string,
	delta: -1 | 1,
): MoveTarget | null {
	const pageIndex = definition.pages.findIndex((p) =>
		p.fieldIds.includes(fieldId),
	);
	const page = definition.pages[pageIndex];
	if (!page) {
		return null;
	}
	const position = page.fieldIds.indexOf(fieldId) + delta;
	if (position >= 0 && position < page.fieldIds.length) {
		return { pageId: page.id, index: position };
	}
	const neighbor = definition.pages[pageIndex + delta];
	if (!neighbor) {
		return null;
	}
	return {
		pageId: neighbor.id,
		index: delta < 0 ? neighbor.fieldIds.length : 0,
	};
}

export interface FieldChoice {
	/** 선택할 수 없는 이유. 없으면 선택 가능 */
	disabledReason?: string;
	field: FieldDef;
}

/**
 * 식별/연락처/결제 기준 질문 후보.
 * form-core 무결성 규칙(필수 + 조건 없음 + 허용 타입)을 미리 적용해 고를 수 없는 항목은 이유와 함께 비활성화한다.
 */
export function anchorChoices(
	definition: FormDefinition,
	index: EditorIndex,
	types: readonly FieldType[],
): FieldChoice[] {
	return index.ordered
		.filter((field) => types.includes(field.type))
		.map((field) => {
			const page = definition.pages[index.pageIndexOf.get(field.id) ?? -1];
			if (!field.required) {
				return { field, disabledReason: "필수 질문이어야 합니다" };
			}
			if (field.showIf || page?.showIf) {
				return { field, disabledReason: "표시 조건이 없어야 합니다" };
			}
			return { field };
		});
}

export const IDENTITY_TYPES: readonly FieldType[] = [
	"phone",
	"email",
	"short_text",
];
export const CONTACT_TYPES: readonly FieldType[] = ["phone"];
export const PAYMENT_TYPES: readonly FieldType[] = ["single_choice"];
