import type { Condition } from "@jwc/form-core/definition/condition";
import type { FormDefinition } from "@jwc/form-core/definition/definition";

/**
 * 정의 안에서 필드 id/옵션 값을 가리키는 "참조 지점"을 한 곳에 모은다.
 * 이름 변경/삭제는 모두 여기의 순수 변환을 거치므로, 참조가 끊긴 정의가 만들어지지 않는다.
 * 참조 지점: 필드/페이지 showIf, pages[].fieldIds, identity, contact, payment.amount(byOption), 알림 템플릿 {{id}}.
 */

export type LeafCondition = Exclude<Condition, { op: "all" | "any" | "not" }>;
/** 잎 조건 변환. 같은 객체를 돌려주면 "변경 없음", null이면 "제거" */
export type LeafTransform = (leaf: LeafCondition) => LeafCondition | null;

function transformGroup(
	condition: Extract<Condition, { op: "all" | "any" }>,
	fn: LeafTransform,
): Condition | null {
	const children = condition.conditions
		.map((child) => transformCondition(child, fn))
		.filter((child): child is Condition => child !== null);
	if (children.length === 0) {
		return null;
	}
	const unchanged =
		children.length === condition.conditions.length &&
		children.every((child, index) => child === condition.conditions[index]);
	return unchanged ? condition : { ...condition, conditions: children };
}

/** 구조 공유: 바뀌지 않은 하위 조건은 같은 객체를 유지한다 (React.memo가 그대로 동작) */
function transformCondition(
	condition: Condition,
	fn: LeafTransform,
): Condition | null {
	if (condition.op === "all" || condition.op === "any") {
		return transformGroup(condition, fn);
	}
	if (condition.op === "not") {
		const inner = transformCondition(condition.condition, fn);
		if (inner === null) {
			return null;
		}
		return inner === condition.condition
			? condition
			: { op: "not", condition: inner };
	}
	return fn(condition);
}

function withCondition<T extends { showIf?: Condition }>(
	item: T,
	fn: LeafTransform,
): T {
	if (!item.showIf) {
		return item;
	}
	const next = transformCondition(item.showIf, fn);
	if (next === item.showIf) {
		return item;
	}
	return { ...item, showIf: next ?? undefined };
}

export function mapAllConditions(
	definition: FormDefinition,
	fn: LeafTransform,
): Pick<FormDefinition, "fields" | "pages"> {
	return {
		fields: definition.fields.map((field) => withCondition(field, fn)),
		pages: definition.pages.map((page) => withCondition(page, fn)),
	};
}

/** 필드 id는 [a-z0-9_]만 허용되므로 정규식 이스케이프가 필요 없다 */
const templateToken = (id: string, flags = "") =>
	new RegExp(`\\{\\{\\s*${id}\\s*\\}\\}`, flags);

function renameInTemplates(
	notifications: FormDefinition["notifications"],
	from: string,
	to: string,
): FormDefinition["notifications"] {
	if (!notifications) {
		return notifications;
	}
	const token = templateToken(from, "g");
	return Object.fromEntries(
		Object.entries(notifications).map(([kind, text]) => [
			kind,
			text?.replace(token, `{{${to}}}`),
		]),
	);
}

function renamePayment(
	payment: FormDefinition["payment"],
	from: string,
	to: string,
): FormDefinition["payment"] {
	if (payment?.amount.kind !== "byOption" || payment.amount.fieldId !== from) {
		return payment;
	}
	return { ...payment, amount: { ...payment.amount, fieldId: to } };
}

/** 필드 id 변경을 모든 참조 지점에 전파한다 */
export function renameField(
	definition: FormDefinition,
	from: string,
	to: string,
): FormDefinition {
	const renamed = mapAllConditions(definition, (leaf) =>
		leaf.fieldId === from ? { ...leaf, fieldId: to } : leaf,
	);
	const swap = (id: string) => (id === from ? to : id);
	return {
		...definition,
		fields: renamed.fields.map((field) =>
			field.id === from ? { ...field, id: to } : field,
		),
		pages: renamed.pages.map((page) =>
			page.fieldIds.includes(from)
				? { ...page, fieldIds: page.fieldIds.map(swap) }
				: page,
		),
		identity: { fieldId: swap(definition.identity.fieldId) },
		contact: definition.contact && {
			phoneFieldId: swap(definition.contact.phoneFieldId),
		},
		payment: renamePayment(definition.payment, from, to),
		notifications: renameInTemplates(definition.notifications, from, to),
	};
}

function detachPayment(
	payment: FormDefinition["payment"],
	fieldId: string,
): FormDefinition["payment"] {
	if (
		payment?.amount.kind !== "byOption" ||
		payment.amount.fieldId !== fieldId
	) {
		return payment;
	}
	return { ...payment, amount: { kind: "byOption", fieldId: "", amounts: {} } };
}

/**
 * 필드 삭제: 이 필드를 참조하던 조건은 함께 지운다.
 * 식별/결제 필드 참조는 빈 값으로 두어 "다시 선택해야 함"이 검증 오류로 드러나게 한다.
 */
export function removeField(
	definition: FormDefinition,
	fieldId: string,
): FormDefinition {
	const cleaned = mapAllConditions(definition, (leaf) =>
		leaf.fieldId === fieldId ? null : leaf,
	);
	const isContact = definition.contact?.phoneFieldId === fieldId;
	return {
		...definition,
		fields: cleaned.fields.filter((field) => field.id !== fieldId),
		pages: cleaned.pages.map((page) =>
			page.fieldIds.includes(fieldId)
				? { ...page, fieldIds: page.fieldIds.filter((id) => id !== fieldId) }
				: page,
		),
		identity:
			definition.identity.fieldId === fieldId
				? { fieldId: "" }
				: definition.identity,
		contact: isContact ? { phoneFieldId: "" } : definition.contact,
		payment: detachPayment(definition.payment, fieldId),
	};
}

function hasLeafOn(condition: Condition | undefined, fieldId: string): boolean {
	if (!condition) {
		return false;
	}
	let found = false;
	transformCondition(condition, (leaf) => {
		found ||= leaf.fieldId === fieldId;
		return leaf;
	});
	return found;
}

/** 표시 조건에서 이 필드를 쓰는 질문/페이지 (자기 자신의 조건은 제외) */
function conditionRefs(definition: FormDefinition, fieldId: string): string[] {
	const refs: string[] = [];
	for (const field of definition.fields) {
		if (field.id !== fieldId && hasLeafOn(field.showIf, fieldId)) {
			refs.push(`질문 "${field.label}"의 표시 조건`);
		}
	}
	for (const page of definition.pages) {
		if (hasLeafOn(page.showIf, fieldId)) {
			refs.push(`페이지 "${page.title}"의 표시 조건`);
		}
	}
	return refs;
}

/** 설정(식별/SMS/결제/알림 문구)에서 이 필드를 쓰는 곳 */
function settingsRefs(definition: FormDefinition, fieldId: string): string[] {
	const refs: string[] = [];
	if (definition.identity.fieldId === fieldId) {
		refs.push("응답자 식별 질문");
	}
	if (definition.contact?.phoneFieldId === fieldId) {
		refs.push("SMS 수신 번호");
	}
	const amount = definition.payment?.amount;
	if (amount?.kind === "byOption" && amount.fieldId === fieldId) {
		refs.push("선택지별 결제 금액");
	}
	const token = templateToken(fieldId);
	if (
		Object.values(definition.notifications ?? {}).some(
			(text) => text !== undefined && token.test(text),
		)
	) {
		refs.push("알림 문구의 변수");
	}
	return refs;
}

/** 삭제 확인 창에 보여줄 "이 필드를 쓰는 곳" 목록 */
export function referencesTo(
	definition: FormDefinition,
	fieldId: string,
): string[] {
	return [
		...conditionRefs(definition, fieldId),
		...settingsRefs(definition, fieldId),
	];
}
