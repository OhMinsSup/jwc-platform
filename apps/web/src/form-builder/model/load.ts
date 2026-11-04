import { DEFINITION_SCHEMA_VERSION, parseFormDefinition } from "@jwc/form-core";
import type { FieldDef, FieldType, FormDefinition } from "@jwc/form-core";

import { createField, FIELD_CATALOG } from "./field-catalog";

type Loose = Record<string, unknown>;

function isObject(value: unknown): value is Loose {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFieldType(value: unknown): value is FieldType {
	return typeof value === "string" && Object.hasOwn(FIELD_CATALOG, value);
}

/** 타입 기본값 위에 저장된 값을 덮는다 → 누락된 기본 속성만 채워진다 */
function looseField(raw: unknown): FieldDef | null {
	if (!(isObject(raw) && isFieldType(raw.type) && typeof raw.id === "string")) {
		return null;
	}
	return { ...createField(raw.type, raw.id, ""), ...raw };
}

function looseFields(raw: unknown): FieldDef[] | null {
	if (!Array.isArray(raw)) {
		return null;
	}
	const fields = raw.map(looseField);
	return fields.every((field): field is FieldDef => field !== null)
		? fields
		: null;
}

type PageDef = FormDefinition["pages"][number];

/** 편집기를 여는 데 필요한 구조(id, fieldIds 배열)만 확인한다. 나머지 오류는 편집 화면의 검증이 보여준다 */
function isLoosePage(page: unknown): page is PageDef {
	return (
		isObject(page) &&
		typeof page.id === "string" &&
		Array.isArray(page.fieldIds)
	);
}

function loosePages(raw: unknown): FormDefinition["pages"] | null {
	if (!Array.isArray(raw)) {
		return null;
	}
	const pages: unknown[] = raw;
	return pages.every(isLoosePage) ? pages : null;
}

/**
 * 저장된 초안(unknown) → 편집 가능한 정의.
 * 초안은 검증 실패 상태로도 저장되므로(편집 중 보존) 완전한 파싱이 실패해도
 * 구조만 맞으면 열어서 고칠 수 있게 한다. 구조 자체가 깨졌으면 null.
 */
export function toEditable(draft: unknown): FormDefinition | null {
	const parsed = parseFormDefinition(draft);
	if (parsed.ok) {
		return parsed.definition;
	}
	if (!isObject(draft)) {
		return null;
	}
	const fields = looseFields(draft.fields);
	const pages = loosePages(draft.pages);
	if (!(fields && pages)) {
		return null;
	}
	const identity = isObject(draft.identity) ? draft.identity : { fieldId: "" };
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- 검증에 실패한 초안을 고칠 수 있게 여는 의도된 느슨한 경로다. 구조(fields/pages/identity)만 확인했고 나머지 오류는 편집 화면의 검증 결과로 드러난다
	return {
		...draft,
		schemaVersion: DEFINITION_SCHEMA_VERSION,
		title: typeof draft.title === "string" ? draft.title : "",
		timezone:
			typeof draft.timezone === "string" ? draft.timezone : "Asia/Seoul",
		fields,
		pages,
		identity,
	} as FormDefinition;
}
