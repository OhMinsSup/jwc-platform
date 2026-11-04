import {
	formatFieldValue,
	formatInTimeZone,
	isDisplayOnly,
} from "@jwc/form-core";

import { NotFoundError } from "../errors";
import { findFormById } from "../repositories/forms";
import { listSubmissions } from "../repositories/submissions";
import { sheets, spreadsheetUrl } from "../runtime";
import { publishedFormById } from "./definitions";
import { readAllRecords } from "./sheet-store";

const PREVIEW_COLUMN_LIMIT = 6;

interface SubmissionRowView {
	cells: Record<string, string>;
	id: string;
	paid: boolean;
	reminderCount: number;
	submittedAt: string;
	syncing: boolean;
}

/** 관리자 응답 목록: 상태는 D1, 답변은 시트 1회 읽기로 합친다 */
export async function listSubmissionRows(formId: string) {
	const form = await findFormById(formId);
	if (!form) {
		throw new NotFoundError("폼을 찾을 수 없습니다");
	}
	const { definition } = await publishedFormById(formId);
	const columns = definition.fields
		.filter((field) => !isDisplayOnly(field))
		.slice(0, PREVIEW_COLUMN_LIMIT)
		.map((field) => ({ id: field.id, label: field.label }));
	const [rows, records] = await Promise.all([
		listSubmissions(formId),
		readAllRecords(sheets(), form.sheetName, definition),
	]);
	const fields = new Map(definition.fields.map((field) => [field.id, field]));

	const views: SubmissionRowView[] = rows.map((row) => {
		const answers = records.get(row.id)?.answers ?? {};
		const cells: Record<string, string> = {};
		for (const column of columns) {
			const field = fields.get(column.id);
			const value = answers[column.id];
			cells[column.id] =
				field && value !== undefined ? formatFieldValue(field, value) : "";
		}
		return {
			id: row.id,
			submittedAt: formatInTimeZone(row.submittedAt, definition.timezone),
			paid: row.paid,
			reminderCount: row.reminderCount,
			syncing: row.sheetSyncedRevision < row.revision,
			cells,
		};
	});
	return {
		title: definition.title,
		columns,
		rows: views,
		spreadsheetUrl: spreadsheetUrl(),
	};
}
