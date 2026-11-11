import { collectConditionFieldIds } from "./condition";
import type { Condition } from "./condition";
import type { FieldDef } from "./fields";
import { checkFieldRules, checkNotifications } from "./integrity-rules";
import type {
	DefinitionShape,
	HeaderRules,
	IntegrityIssue,
} from "./integrity-types";
import { RESERVED_TEMPLATE_KEYS } from "./reserved";

type Check = (
	definition: DefinitionShape,
	rules: HeaderRules,
) => IntegrityIssue[];

function checkUniqueIds(definition: DefinitionShape): IntegrityIssue[] {
	const issues: IntegrityIssue[] = [];
	const seenFields = new Set<string>();
	for (const [index, field] of definition.fields.entries()) {
		if (seenFields.has(field.id)) {
			issues.push({
				path: ["fields", index, "id"],
				message: `필드 id 중복: ${field.id}`,
			});
		}
		if (RESERVED_TEMPLATE_KEYS.has(field.id)) {
			issues.push({
				path: ["fields", index, "id"],
				message: `예약어는 필드 id로 쓸 수 없습니다: ${field.id}`,
			});
		}
		seenFields.add(field.id);
	}
	const seenPages = new Set<string>();
	for (const [index, page] of definition.pages.entries()) {
		if (seenPages.has(page.id)) {
			issues.push({
				path: ["pages", index, "id"],
				message: `페이지 id 중복: ${page.id}`,
			});
		}
		seenPages.add(page.id);
	}
	return issues;
}

function checkPagePlacement(definition: DefinitionShape): IntegrityIssue[] {
	const issues: IntegrityIssue[] = [];
	const known = new Set(definition.fields.map((field) => field.id));
	const placed = new Map<string, number>();
	for (const [pageIndex, page] of definition.pages.entries()) {
		for (const [position, fieldId] of page.fieldIds.entries()) {
			if (!known.has(fieldId)) {
				issues.push({
					path: ["pages", pageIndex, "fieldIds", position],
					message: `존재하지 않는 필드: ${fieldId}`,
				});
			}
			if (placed.has(fieldId)) {
				issues.push({
					path: ["pages", pageIndex, "fieldIds", position],
					message: `필드가 두 페이지에 배치됨: ${fieldId}`,
				});
			}
			placed.set(fieldId, pageIndex);
		}
	}
	for (const [index, field] of definition.fields.entries()) {
		if (!placed.has(field.id)) {
			issues.push({
				path: ["fields", index],
				message: `어떤 페이지에도 배치되지 않은 필드: ${field.id}`,
			});
		}
	}
	return issues;
}

/** 표시 순서(페이지 순서 → 페이지 내 순서)대로 필드 id를 나열 */
function orderedFieldIds(definition: Pick<DefinitionShape, "pages">): string[] {
	return definition.pages.flatMap((page) => page.fieldIds);
}

type FieldOrder = Map<string, number>;

/** 조건이 참조하는 필드 중 limit 위치보다 앞에 있지 않은(또는 없는) 필드 id */
function refsNotBefore(
	condition: Condition,
	order: FieldOrder,
	limit: number,
): string[] {
	return collectConditionFieldIds(condition).filter((ref) => {
		const refIndex = order.get(ref);
		return refIndex === undefined || refIndex >= limit;
	});
}

function fieldConditionIssues(
	definition: DefinitionShape,
	order: FieldOrder,
): IntegrityIssue[] {
	const issues: IntegrityIssue[] = [];
	for (const [index, field] of definition.fields.entries()) {
		if (!field.showIf) {
			continue;
		}
		const self = order.get(field.id) ?? -1;
		for (const ref of refsNotBefore(field.showIf, order, self)) {
			issues.push({
				path: ["fields", index, "showIf"],
				message: `조건은 앞쪽 필드만 참조할 수 있습니다: ${ref}`,
			});
		}
	}
	return issues;
}

function pageConditionIssues(
	definition: DefinitionShape,
	order: FieldOrder,
): IntegrityIssue[] {
	const issues: IntegrityIssue[] = [];
	for (const [pageIndex, page] of definition.pages.entries()) {
		if (!page.showIf) {
			continue;
		}
		const firstOnPage = order.get(page.fieldIds[0] ?? "") ?? 0;
		for (const ref of refsNotBefore(page.showIf, order, firstOnPage)) {
			issues.push({
				path: ["pages", pageIndex, "showIf"],
				message: `페이지 조건은 이전 페이지 필드만 참조할 수 있습니다: ${ref}`,
			});
		}
	}
	return issues;
}

/** 조건은 자신보다 앞에 나오는 필드만 참조할 수 있다 → 순환이 원천적으로 불가능 */
function checkConditionReferences(
	definition: DefinitionShape,
): IntegrityIssue[] {
	const order: FieldOrder = new Map(
		orderedFieldIds(definition).map((id, index) => [id, index]),
	);
	return [
		...fieldConditionIssues(definition, order),
		...pageConditionIssues(definition, order),
	];
}

function findField(
	definition: DefinitionShape,
	id: string,
): FieldDef | undefined {
	return definition.fields.find((field) => field.id === id);
}

function requireUnconditionalField(
	definition: DefinitionShape,
	fieldId: string,
	path: string[],
	allowedTypes: FieldDef["type"][],
): IntegrityIssue[] {
	const field = findField(definition, fieldId);
	if (!field) {
		return [{ path, message: `존재하지 않는 필드: ${fieldId}` }];
	}
	if (!allowedTypes.includes(field.type)) {
		return [
			{
				path,
				message: `허용되지 않는 필드 타입(${field.type}). 허용: ${allowedTypes.join(", ")}`,
			},
		];
	}
	const page = definition.pages.find((p) => p.fieldIds.includes(fieldId));
	if (!field.required || field.showIf || page?.showIf) {
		return [
			{
				path,
				message: `${fieldId} 필드는 필수이고 조건 없이 항상 표시되어야 합니다`,
			},
		];
	}
	return [];
}

function checkIdentityAndContact(
	definition: DefinitionShape,
): IntegrityIssue[] {
	const issues = requireUnconditionalField(
		definition,
		definition.identity.fieldId,
		["identity", "fieldId"],
		["phone", "email", "short_text"],
	);
	if (definition.contact) {
		issues.push(
			...requireUnconditionalField(
				definition,
				definition.contact.phoneFieldId,
				["contact", "phoneFieldId"],
				["phone"],
			),
		);
	}
	return issues;
}

function checkPayment(definition: DefinitionShape): IntegrityIssue[] {
	const amount = definition.payment?.amount;
	if (amount?.kind !== "byOption") {
		return [];
	}
	const issues = requireUnconditionalField(
		definition,
		amount.fieldId,
		["payment", "amount", "fieldId"],
		["single_choice"],
	);
	const field = findField(definition, amount.fieldId);
	if (field?.type !== "single_choice") {
		return issues;
	}
	for (const option of field.options) {
		if (amount.amounts[option.value] === undefined) {
			issues.push({
				path: ["payment", "amount", "amounts"],
				message: `옵션 금액 누락: ${option.value}`,
			});
		}
	}
	return issues;
}

const CHECKS: Check[] = [
	checkUniqueIds,
	checkPagePlacement,
	checkConditionReferences,
	checkIdentityAndContact,
	checkPayment,
	checkNotifications,
	checkFieldRules,
];

export function checkDefinitionIntegrity(
	definition: DefinitionShape,
	rules: HeaderRules,
): IntegrityIssue[] {
	return CHECKS.flatMap((check) => check(definition, rules));
}
