import type { Answers } from "./answers/value";
import type { FormDefinition, NotificationKind } from "./definition/definition";
import type { BuiltinTemplateKey } from "./definition/reserved";
import { formatFieldValue } from "./field-types/values";

const TEMPLATE_TOKEN = /\{\{\s*(?<key>[a-z][a-z0-9_]*)\s*\}\}/gu;

/** 결제 금액. 결제 설정이 없거나 금액을 정할 수 없으면 null */
export function computeAmount(
	definition: FormDefinition,
	answers: Answers,
): number | null {
	const amount = definition.payment?.amount;
	if (!amount) {
		return null;
	}
	if (amount.kind === "fixed") {
		return amount.value;
	}
	const selected = answers[amount.fieldId];
	return typeof selected === "string"
		? (amount.amounts[selected] ?? null)
		: null;
}

export interface MessageContext {
	link: string;
	submissionId: string;
}

/** 템플릿 변수 = 필드 표시값(fieldId 키) + 내장 변수 */
export function messageVariables(
	definition: FormDefinition,
	answers: Answers,
	context: MessageContext,
): Record<string, string> {
	const variables: Record<string, string> = {};
	for (const field of definition.fields) {
		const value = answers[field.id];
		variables[field.id] =
			value === undefined ? "" : formatFieldValue(field, value);
	}
	const amount = computeAmount(definition, answers);
	const builtins: Record<BuiltinTemplateKey, string> = {
		title: definition.title,
		amount: amount === null ? "" : amount.toLocaleString("ko-KR"),
		account: definition.payment?.account ?? "",
		link: context.link,
		submission_id: context.submissionId,
	};
	return { ...variables, ...builtins };
}

/** {{key}} 치환. 알 수 없는 키는 빈 문자열 */
export function renderTemplate(
	template: string,
	variables: Record<string, string>,
): string {
	return template.replaceAll(
		TEMPLATE_TOKEN,
		(_, key: string) => variables[key] ?? "",
	);
}

export function templateFor(
	definition: FormDefinition,
	kind: NotificationKind,
): string | undefined {
	return definition.notifications?.[kind];
}
