import type { Answers } from "@jwc/form-core/answers/value";
import type { FormDefinition } from "@jwc/form-core/definition/definition";
import { isDisplayOnly } from "@jwc/form-core/definition/fields";
import { formatFieldValue } from "@jwc/form-core/field-types/values";
import { resolveVisibility } from "@jwc/form-core/logic/visibility";
import { computeAmount } from "@jwc/form-core/messaging";
import { formatInTimeZone } from "@jwc/form-core/time";

import { NotFoundError } from "../../../platform/server/errors/not-found-error";
import { publishedFormById } from "../../forms/server/definitions";
import { responseStore } from "../../forms/server/response-store";
import { findKey, isStoredKey } from "./submission-keys-repository";

const PHONE_MASK = /^(?<head>\d{3})-(?<middle>\d{3,4})-(?<tail>\d{4})$/u;

function maskPhone(formatted: string): string {
	return formatted.replace(
		PHONE_MASK,
		(_, head: string, middle: string, tail: string) =>
			`${head}-${"*".repeat(middle.length)}-${tail}`,
	);
}

export interface SubmissionView {
	account: string | null;
	amount: number | null;
	formTitle: string;
	items: { label: string; value: string }[];
	paid: boolean;
	submittedAt: string;
}

const NOT_FOUND_MESSAGE = "신청 내역을 찾을 수 없습니다";

/** 보이는 질문의 답변만 표시용 문자열로 바꾼다 (전화번호는 마스킹) */
function visibleItems(
	definition: FormDefinition,
	answers: Answers,
): SubmissionView["items"] {
	const visible = new Set(resolveVisibility(definition, answers).fieldIds);
	const items: SubmissionView["items"] = [];
	for (const field of definition.fields) {
		const answer = answers[field.id];
		if (
			isDisplayOnly(field) ||
			!visible.has(field.id) ||
			answer === undefined
		) {
			continue;
		}
		const value = formatFieldValue(field, answer);
		items.push({
			label: field.label,
			value: field.type === "phone" ? maskPhone(value) : value,
		});
	}
	return items;
}

/** 신청 확인 화면: 답변과 납입 여부는 저장소(원본)에서, 제출 시각은 D1 키에서 읽는다. 전화번호는 마스킹. */
export async function loadSubmissionView(id: string): Promise<SubmissionView> {
	const key = await findKey(id);
	if (!isStoredKey(key)) {
		throw new NotFoundError(NOT_FOUND_MESSAGE);
	}
	const { definition, sheet } = await publishedFormById(key.formId);
	const record = await responseStore(sheet, definition).get(id);
	if (!record) {
		throw new NotFoundError(NOT_FOUND_MESSAGE);
	}
	return {
		formTitle: definition.title,
		submittedAt: formatInTimeZone(key.createdAt, definition.timezone),
		paid: record.paid,
		amount: computeAmount(definition, record.answers),
		account: definition.payment?.account ?? null,
		items: visibleItems(definition, record.answers),
	};
}
