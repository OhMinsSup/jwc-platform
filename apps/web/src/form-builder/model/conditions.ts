import type { Condition, FieldDef, FieldType } from "@jwc/form-core";

/**
 * 조건 편집기는 "규칙 목록 + 결합 방식(모두/하나라도)"만 다룬다.
 * 저장 형태는 항상 form-core의 Condition이며, 이 모델은 렌더링 때마다 Condition에서 파생된다
 * (편집기 상태를 따로 두지 않으므로 두 표현이 어긋날 수 없다).
 */
export type RuleOp = "equals" | "notEquals" | "in" | "answered" | "notAnswered";
type RuleValue = string | number | boolean;

export interface ConditionRule {
	fieldId: string;
	op: RuleOp;
	value?: RuleValue;
	values?: string[];
}

export type RuleJoin = "all" | "any";

export interface ConditionDraft {
	join: RuleJoin;
	rules: ConditionRule[];
}

/** 조건 값 입력 방식. 질문 유형 → 값 편집기 종류 */
export type RuleValueKind = "option" | "boolean" | "number" | "text" | "none";

const TEXT_OPS: RuleOp[] = ["equals", "notEquals", "answered", "notAnswered"];
const CHOICE_OPS: RuleOp[] = [
	"equals",
	"notEquals",
	"in",
	"answered",
	"notAnswered",
];

/** 질문 유형 → (사용 가능한 연산자, 값 입력 방식) */
export const RULE_SPEC_BY_TYPE: Record<
	FieldType,
	{ ops: RuleOp[]; valueKind: RuleValueKind }
> = {
	short_text: { ops: TEXT_OPS, valueKind: "text" },
	long_text: { ops: ["answered", "notAnswered"], valueKind: "text" },
	number: { ops: TEXT_OPS, valueKind: "number" },
	phone: { ops: ["answered", "notAnswered"], valueKind: "text" },
	email: { ops: ["answered", "notAnswered"], valueKind: "text" },
	single_choice: { ops: CHOICE_OPS, valueKind: "option" },
	multi_choice: { ops: CHOICE_OPS, valueKind: "option" },
	boolean: { ops: ["equals", "answered", "notAnswered"], valueKind: "boolean" },
	rating: { ops: TEXT_OPS, valueKind: "number" },
	date: { ops: TEXT_OPS, valueKind: "text" },
	time: { ops: TEXT_OPS, valueKind: "text" },
	datetime: { ops: ["answered", "notAnswered"], valueKind: "text" },
	statement: { ops: [], valueKind: "none" },
};

const OP_LABELS: Record<RuleOp, string> = {
	equals: "이(가) 다음과 같음",
	notEquals: "이(가) 다음이 아님",
	in: "이(가) 다음 중 하나",
	answered: "에 응답함",
	notAnswered: "에 응답하지 않음",
};

const MULTI_OP_LABELS: Partial<Record<RuleOp, string>> = {
	equals: "에서 다음을 선택함",
	notEquals: "에서 다음을 선택하지 않음",
	in: "에서 다음 중 하나라도 선택함",
};

export function opLabel(op: RuleOp, fieldType: FieldType | undefined): string {
	return (
		(fieldType === "multi_choice" ? MULTI_OP_LABELS[op] : undefined) ??
		OP_LABELS[op]
	);
}

/** Select에서 받은 값이 알려진 연산자인지 (OP_LABELS의 키가 연산자 목록이다) */
export function isRuleOp(value: unknown): value is RuleOp {
	return typeof value === "string" && Object.hasOwn(OP_LABELS, value);
}

export function opNeedsValue(op: RuleOp): boolean {
	return op === "equals" || op === "notEquals" || op === "in";
}

/** 조건에 쓸 수 있는 질문인지 (안내문은 답이 없다) */
export function isConditionSource(field: FieldDef): boolean {
	return RULE_SPEC_BY_TYPE[field.type].ops.length > 0;
}

function defaultValue(field: FieldDef): RuleValue {
	if ("options" in field) {
		return field.options[0]?.value ?? "";
	}
	if (field.type === "boolean") {
		return true;
	}
	return RULE_SPEC_BY_TYPE[field.type].valueKind === "number" ? 0 : "";
}

/** 질문을 고르면 그 유형에 맞는 첫 연산자/값으로 규칙을 다시 만든다 */
export function ruleFor(field: FieldDef): ConditionRule {
	const op = RULE_SPEC_BY_TYPE[field.type].ops[0] ?? "answered";
	return opNeedsValue(op)
		? { fieldId: field.id, op, value: defaultValue(field) }
		: { fieldId: field.id, op };
}

/** 연산자 변경: 값 형태(단일/목록)를 연산자에 맞게 옮긴다 */
export function withOp(rule: ConditionRule, op: RuleOp): ConditionRule {
	if (op === "in") {
		const first = rule.values?.[0] ?? rule.value;
		return {
			fieldId: rule.fieldId,
			op,
			values: first === undefined ? [] : [String(first)],
		};
	}
	if (opNeedsValue(op)) {
		return {
			fieldId: rule.fieldId,
			op,
			value: rule.value ?? rule.values?.[0] ?? "",
		};
	}
	return { fieldId: rule.fieldId, op };
}

type Leaf = Exclude<Condition, { op: "all" | "any" | "not" }>;

function ruleFromLeaf(condition: Condition): ConditionRule | null {
	switch (condition.op) {
		case "equals":
		case "notEquals": {
			return {
				fieldId: condition.fieldId,
				op: condition.op,
				value: condition.value,
			};
		}
		case "in": {
			return { fieldId: condition.fieldId, op: "in", values: condition.values };
		}
		case "answered": {
			return { fieldId: condition.fieldId, op: "answered" };
		}
		case "not": {
			return condition.condition.op === "answered"
				? { fieldId: condition.condition.fieldId, op: "notAnswered" }
				: null;
		}
		// 그룹 안의 그룹은 편집기가 표현할 수 없다
		case "all":
		case "any": {
			return null;
		}
		// 느슨하게 연 초안(load.ts)은 조건을 검증하지 않으므로 알 수 없는 연산자가 올 수 있다
		default: {
			return null;
		}
	}
}

function leafFromRule(rule: ConditionRule): Condition {
	if (rule.op === "in") {
		return { op: "in", fieldId: rule.fieldId, values: rule.values ?? [] };
	}
	if (rule.op === "answered") {
		return { op: "answered", fieldId: rule.fieldId };
	}
	if (rule.op === "notAnswered") {
		return { op: "not", condition: { op: "answered", fieldId: rule.fieldId } };
	}
	return {
		op: rule.op,
		fieldId: rule.fieldId,
		value: rule.value ?? "",
	} satisfies Leaf;
}

const EMPTY_DRAFT: ConditionDraft = { join: "all", rules: [] };

/**
 * Condition → 편집 모델. 편집기가 표현할 수 없는 중첩 구조(예: 그룹 안의 그룹)는 null.
 * null이면 UI가 "직접 편집 불가 · 초기화"를 보여준다 (데이터를 몰래 바꾸지 않는다).
 */
export function toDraft(
	condition: Condition | undefined,
): ConditionDraft | null {
	if (!condition) {
		return EMPTY_DRAFT;
	}
	if (condition.op === "all" || condition.op === "any") {
		const rules = condition.conditions.map(ruleFromLeaf);
		return rules.every((item): item is ConditionRule => item !== null)
			? { join: condition.op, rules }
			: null;
	}
	const rule = ruleFromLeaf(condition);
	return rule ? { join: "all", rules: [rule] } : null;
}

/** 편집 모델 → Condition. 규칙이 없으면 "항상 표시"(undefined) */
export function fromDraft(draft: ConditionDraft): Condition | undefined {
	const leaves = draft.rules.map(leafFromRule);
	if (leaves.length === 0) {
		return undefined;
	}
	if (leaves.length === 1) {
		return leaves[0];
	}
	return { op: draft.join, conditions: leaves };
}

export interface ValueChoices {
	choices: { value: string; label: string }[];
	/** Select의 문자열 값 → 조건에 저장할 값 */
	parse: (raw: string) => RuleValue;
}

/**
 * 조건 값을 "목록에서 고르기"로 받을 수 있는 질문이면 그 목록을 파생한다.
 * 선택형 → 선택지, 예/아니오 → 두 문구. 그 외(자유 입력)는 null.
 */
export function valueChoicesOf(field: FieldDef): ValueChoices | null {
	if ("options" in field) {
		return {
			choices: field.options.map((o) => ({ value: o.value, label: o.label })),
			parse: (raw) => raw,
		};
	}
	if (field.type === "boolean") {
		return {
			choices: [
				{ value: "true", label: field.trueLabel },
				{ value: "false", label: field.falseLabel },
			],
			parse: (raw) => raw === "true",
		};
	}
	return null;
}
