import type { ParsedSheetRow } from "@jwc/form-core/sheet/rows";
import { GoogleAuthError } from "@jwc/google/service-account";
import { SheetsApiError } from "@jwc/google/sheets-client";
import type { SheetsClient } from "@jwc/google/sheets-client";

import { SubmissionStoreError } from "../port";
import type {
	StoredSubmission,
	SubmissionStore,
	SubmissionWrite,
} from "../port";
import {
	ensureSheetLayout,
	readAllRecords,
	readRecord,
	SheetLayoutError,
	writePaidCell,
	writeRecord,
} from "./sheet-table";

/**
 * Google Sheets 어댑터: 폼마다 탭 1개, 1행 헤더, 응답 ID 컬럼으로 행을 찾는다.
 * 운영자는 시트에서 직접 값을 고칠 수 있고, 다음 읽기가 그 값을 그대로 쓴다(별도 동기화 없음).
 */

const UNAUTHORIZED = 401;
const FORBIDDEN = 403;

const FORBIDDEN_MESSAGE =
	"응답 시트에 접근할 수 없습니다. 서비스 계정에 스프레드시트 편집 권한을 공유했는지 확인해주세요";
const UNAVAILABLE_MESSAGE = "응답 시트가 일시적으로 응답하지 않습니다";

function toStored(row: ParsedSheetRow): StoredSubmission {
	return {
		id: row.id,
		answers: row.answers,
		paid: row.paid,
		issues: row.errors,
	};
}

/** 공급자 오류 → 포트 오류. 분류할 수 없는 오류(코드 버그 등)는 그대로 둔다 */
function translate(error: unknown): unknown {
	if (error instanceof SheetLayoutError) {
		return new SubmissionStoreError("layout", error.message, { cause: error });
	}
	if (error instanceof GoogleAuthError) {
		return error.retryable
			? new SubmissionStoreError("unavailable", UNAVAILABLE_MESSAGE, {
					cause: error,
				})
			: new SubmissionStoreError("forbidden", FORBIDDEN_MESSAGE, {
					cause: error,
				});
	}
	if (error instanceof SheetsApiError) {
		if (error.status === UNAUTHORIZED || error.status === FORBIDDEN) {
			return new SubmissionStoreError("forbidden", FORBIDDEN_MESSAGE, {
				cause: error,
			});
		}
		if (error.retryable) {
			return new SubmissionStoreError("unavailable", UNAVAILABLE_MESSAGE, {
				cause: error,
			});
		}
	}
	return error;
}

async function guarded<T>(run: () => Promise<T>): Promise<T> {
	try {
		return await run();
	} catch (error) {
		throw translate(error);
	}
}

export function createGoogleSheetsStore(client: SheetsClient): SubmissionStore {
	return {
		prepare: (target) =>
			guarded(async () => {
				await ensureSheetLayout(client, target.collection, target.definition);
			}),
		get: (target, id) =>
			guarded(async () => {
				const row = await readRecord(
					client,
					target.collection,
					target.definition,
					id,
				);
				return row ? toStored(row) : null;
			}),
		list: (target) =>
			guarded(async () => {
				const rows = await readAllRecords(
					client,
					target.collection,
					target.definition,
				);
				return rows.map(toStored);
			}),
		put: (target, record: SubmissionWrite) =>
			guarded(() =>
				writeRecord(client, target.collection, target.definition, record),
			),
		setPaid: (target, id, paid) =>
			guarded(async () => {
				const found = await writePaidCell(client, target.collection, id, paid);
				if (!found) {
					throw new SubmissionStoreError(
						"not_found",
						"응답을 찾을 수 없습니다",
					);
				}
			}),
	};
}
