import type { FormDefinition } from "@jwc/form-core/definition/definition";
import { isDisplayOnly } from "@jwc/form-core/definition/fields";
import type { FieldDef } from "@jwc/form-core/definition/fields";
import { formatFieldValue } from "@jwc/form-core/field-types/values";
import { formatInTimeZone } from "@jwc/form-core/time";
import type { StoredSubmission } from "@jwc/submission-store";

import {
	spreadsheetUrl,
	submissionStore,
} from "../../../platform/server/runtime";
import {
	publishedFormById,
	storeTargetOf,
} from "../../forms/server/definitions";
import { paymentDueOf } from "../domain/payment-due";
import type { PaymentDue } from "../domain/payment-due";
import { listStoredKeys } from "./submission-keys-repository";

const PREVIEW_COLUMN_LIMIT = 6;

interface PreviewColumn {
	id: string;
	label: string;
}

interface SubmissionRowView extends PaymentDue {
	cells: Record<string, string>;
	id: string;
	issueHeaders: string[];
	paid: boolean;
	submittedAt: string;
}

function previewColumns(definition: FormDefinition): PreviewColumn[] {
	return definition.fields
		.filter((field) => !isDisplayOnly(field))
		.slice(0, PREVIEW_COLUMN_LIMIT)
		.map((field) => ({ id: field.id, label: field.label }));
}

/** 레코드 1건 → 표 1행 (순수 변환) */
function toRowView(
	record: StoredSubmission,
	columns: readonly PreviewColumn[],
	fields: ReadonlyMap<string, FieldDef>,
	meta: PaymentDue & { submittedAt: string },
): SubmissionRowView {
	const cells: Record<string, string> = {};
	for (const column of columns) {
		const field = fields.get(column.id);
		const value = record.answers[column.id];
		cells[column.id] =
			field && value !== undefined ? formatFieldValue(field, value) : "";
	}
	return {
		id: record.id,
		paid: record.paid,
		issueHeaders: Object.keys(record.issues),
		cells,
		...meta,
	};
}

/**
 * 관리자 응답 목록: 답변/납입 여부는 저장소(원본) 1회 읽기, 제출 시각은 D1 키에서 읽는다.
 * 표시는 저장소 순서를 따른다.
 */
export async function listSubmissionRows(formId: string) {
	const { form, definition } = await publishedFormById(formId);
	const columns = previewColumns(definition);
	const [records, keys] = await Promise.all([
		submissionStore().list(storeTargetOf(form, definition)),
		listStoredKeys(formId),
	]);
	const createdAt = new Map(keys.map((key) => [key.id, key.createdAt]));
	const fields = new Map(definition.fields.map((field) => [field.id, field]));
	const rows = records.map((record) => {
		const submitted = createdAt.get(record.id);
		return toRowView(record, columns, fields, {
			submittedAt:
				submitted === undefined
					? ""
					: formatInTimeZone(submitted, definition.timezone),
			...paymentDueOf(definition, record.answers),
		});
	});
	return {
		title: definition.title,
		columns,
		rows,
		/** 회비 설정 (없으면 null): 입금 계좌, 옵션별 금액이면 그 질문 이름 */
		payment: definition.payment
			? {
					account: definition.payment.account,
					groupLabel:
						definition.payment.amount.kind === "byOption"
							? (fields.get(definition.payment.amount.fieldId)?.label ?? null)
							: null,
				}
			: null,
		spreadsheetUrl: spreadsheetUrl(),
	};
}
