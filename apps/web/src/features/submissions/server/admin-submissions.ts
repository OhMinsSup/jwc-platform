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
import { listStoredKeys, reminderHistory } from "./submission-keys-repository";

const PREVIEW_COLUMN_LIMIT = 6;

interface PreviewColumn {
	id: string;
	label: string;
}

interface SubmissionRowView {
	cells: Record<string, string>;
	id: string;
	issueHeaders: string[];
	paid: boolean;
	reminderCount: number;
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
	meta: { submittedAt: string; reminderCount: number },
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
 * 관리자 응답 목록: 답변/납입 여부는 저장소(원본) 1회 읽기, 제출 시각은 D1 키, 알림 횟수는 발송 기록에서 파생.
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
	const history = await reminderHistory(records.map((record) => record.id));
	const fields = new Map(definition.fields.map((field) => [field.id, field]));
	const rows = records.map((record) => {
		const submitted = createdAt.get(record.id);
		return toRowView(record, columns, fields, {
			submittedAt:
				submitted === undefined
					? ""
					: formatInTimeZone(submitted, definition.timezone),
			reminderCount: history.get(record.id)?.sentCount ?? 0,
		});
	});
	return {
		title: definition.title,
		columns,
		rows,
		spreadsheetUrl: spreadsheetUrl(),
	};
}
