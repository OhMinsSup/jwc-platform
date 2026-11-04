import {
	computeAmount,
	formatFieldValue,
	formatInTimeZone,
	isDisplayOnly,
	resolveVisibility,
} from "@jwc/form-core";
import type { Answers, FormDefinition } from "@jwc/form-core";

import { NotFoundError } from "../errors";
import { findFormById } from "../repositories/forms";
import { findSubmission } from "../repositories/submissions";
import { sheets } from "../runtime";
import { definitionOfVersion } from "./definitions";
import { readRecord } from "./sheet-store";

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
	syncing: boolean;
}

async function findSubmissionWithForm(id: string) {
	const submission = await findSubmission(id);
	const form = submission ? await findFormById(submission.formId) : undefined;
	if (!(submission && form)) {
		throw new NotFoundError("신청 내역을 찾을 수 없습니다");
	}
	return { submission, form };
}

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

/** 신청 확인 화면: 답변은 시트(원본)에서, 상태는 D1에서 읽는다. 전화번호는 마스킹. */
export async function loadSubmissionView(id: string): Promise<SubmissionView> {
	const { submission, form } = await findSubmissionWithForm(id);
	const definition = await definitionOfVersion(submission.formVersionId);
	const syncing = submission.sheetSyncedRevision < submission.revision;
	const record = syncing
		? null
		: await readRecord(sheets(), form.sheetName, definition, id);
	const answers = record?.answers ?? {};

	return {
		formTitle: definition.title,
		submittedAt: formatInTimeZone(submission.submittedAt, definition.timezone),
		paid: record?.paid ?? submission.paid,
		syncing,
		amount: computeAmount(definition, answers),
		account: definition.payment?.account ?? null,
		items: visibleItems(definition, answers),
	};
}
