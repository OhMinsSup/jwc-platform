import type { ChoiceOption, FieldDef, FormDefinition } from "@jwc/form-core";

import { mapAllConditions } from "./references";
import type { LeafCondition, LeafTransform } from "./references";

/** 선택지 값은 조건(equals/in)과 선택지별 금액의 키로 쓰인다. 그 참조를 함께 갱신한다. */

type InLeaf = Extract<LeafCondition, { op: "in" }>;

function remapInLeaf(
	leaf: InLeaf,
	from: string,
	to: string | null,
): LeafCondition | null {
	if (!leaf.values.includes(from)) {
		return leaf;
	}
	const values =
		to === null
			? leaf.values.filter((v) => v !== from)
			: leaf.values.map((v) => (v === from ? to : v));
	return values.length > 0 ? { ...leaf, values } : null;
}

function optionLeafTransform(
	fieldId: string,
	from: string,
	to: string | null,
): LeafTransform {
	return (leaf) => {
		if (leaf.fieldId !== fieldId) {
			return leaf;
		}
		if (leaf.op === "in") {
			return remapInLeaf(leaf, from, to);
		}
		const matches =
			(leaf.op === "equals" || leaf.op === "notEquals") && leaf.value === from;
		if (!matches) {
			return leaf;
		}
		return to === null ? null : { ...leaf, value: to };
	};
}

function remapAmounts(
	payment: FormDefinition["payment"],
	fieldId: string,
	from: string,
	to: string | null,
): FormDefinition["payment"] {
	if (
		payment?.amount.kind !== "byOption" ||
		payment.amount.fieldId !== fieldId
	) {
		return payment;
	}
	const { amount } = payment;
	const { [from]: moved, ...rest } = amount.amounts;
	const amounts =
		to === null || moved === undefined ? rest : { ...rest, [to]: moved };
	return { ...payment, amount: { ...amount, amounts } };
}

function mapOptions(
	fields: FieldDef[],
	fieldId: string,
	update: (options: ChoiceOption[]) => ChoiceOption[],
): FieldDef[] {
	return fields.map((field) =>
		field.id === fieldId && "options" in field
			? { ...field, options: update(field.options) }
			: field,
	);
}

/** 선택지 값 변경(to) 또는 삭제(to = null)를 조건/결제 금액에 전파한다 */
export function updateOptionRefs(
	definition: FormDefinition,
	fieldId: string,
	from: string,
	to: string | null,
): FormDefinition {
	const remapped = mapAllConditions(
		definition,
		optionLeafTransform(fieldId, from, to),
	);
	const fields = mapOptions(remapped.fields, fieldId, (options) =>
		to === null
			? options.filter((option) => option.value !== from)
			: options.map((option) =>
					option.value === from ? { ...option, value: to } : option,
				),
	);
	return {
		...definition,
		fields,
		pages: remapped.pages,
		payment: remapAmounts(definition.payment, fieldId, from, to),
	};
}
