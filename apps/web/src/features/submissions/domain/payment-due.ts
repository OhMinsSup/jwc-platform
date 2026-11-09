import type { Answers } from "@jwc/form-core/answers/value";
import type { FormDefinition } from "@jwc/form-core/definition/definition";
import { formatFieldValue } from "@jwc/form-core/field-types/values";
import { computeAmount } from "@jwc/form-core/messaging";

/** 응답 1건의 회비: 금액과, 옵션별 금액이면 그 옵션의 표시 이름 (예: "3박4일") */
export interface PaymentDue {
	amount: number | null;
	group: string | null;
}

/** 정의의 payment.amount에서 파생한다 (회비 설정이 없으면 둘 다 null) */
export function paymentDueOf(
	definition: FormDefinition,
	answers: Answers,
): PaymentDue {
	const rule = definition.payment?.amount;
	const amount = computeAmount(definition, answers);
	if (rule?.kind !== "byOption") {
		return { amount, group: null };
	}
	const field = definition.fields.find((f) => f.id === rule.fieldId);
	const value = answers[rule.fieldId];
	return {
		amount,
		group: field && value !== undefined ? formatFieldValue(field, value) : null,
	};
}
