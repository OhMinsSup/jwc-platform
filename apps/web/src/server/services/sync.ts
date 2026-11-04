import { decryptJson } from "../crypto";
import { SheetSyncPayloadSchema } from "../messages";
import type { SheetSyncMessage } from "../messages";
import { findFormById } from "../repositories/forms";
import {
	acquireSyncLock,
	completeSync,
	findSubmission,
	releaseSyncLock,
} from "../repositories/submissions";
import { dataKeys, sheets } from "../runtime";
import { definitionOfVersion } from "./definitions";
import { enqueueNotification } from "./notify";
import { writePaidCell, writeRecord } from "./sheet-store";

/** 같은 응답에 대한 동시 시트 쓰기를 막는 임대 락 시간 */
const LOCK_TTL_MS = 60_000;

/**
 * done: 처리 완료(또는 이미 반영됨) / stale: 더 새로운 메시지가 있어 폐기 / busy: 다른 워커가 처리 중 → 재시도
 */
export type SyncOutcome = "done" | "stale" | "busy";

async function syncUpsert(
	message: Extract<SheetSyncMessage, { kind: "upsert" }>,
	now: number,
): Promise<SyncOutcome> {
	const submission = await findSubmission(message.submissionId);
	if (!submission || message.revision < submission.revision) {
		return "stale";
	}
	if (submission.sheetSyncedRevision >= message.revision) {
		return "done";
	}
	if (!(await acquireSyncLock(submission.id, now, LOCK_TTL_MS))) {
		return "busy";
	}
	try {
		const form = await findFormById(submission.formId);
		if (!form) {
			return "stale";
		}
		const definition = await definitionOfVersion(submission.formVersionId);
		const keys = await dataKeys();
		const payload = SheetSyncPayloadSchema.parse(
			await decryptJson(keys.encryption, message.payload),
		);
		const { answers } = payload;
		await writeRecord(sheets(), form.sheetName, definition, {
			id: submission.id,
			submittedAt: submission.submittedAt,
			updatedAt: submission.updatedAt,
			paid: submission.paid,
			answers,
		});
		// 알림을 먼저 큐에 넣고 나서 동기화 완료를 기록한다.
		// 중간에 실패해 재시도되면 알림이 다시 들어가지만 idempotencyKey로 한 번만 발송된다.
		if (payload.notify) {
			await enqueueNotification(
				definition,
				submission,
				answers,
				payload.notify,
				`${submission.id}:${payload.notify}:${message.revision}`,
			);
		}
		await completeSync(submission.id, message.revision);
		return "done";
	} catch (error) {
		await releaseSyncLock(submission.id);
		throw error;
	}
}

async function syncPaid(
	message: Extract<SheetSyncMessage, { kind: "paid" }>,
): Promise<SyncOutcome> {
	const submission = await findSubmission(message.submissionId);
	const form = submission ? await findFormById(submission.formId) : undefined;
	if (!(submission && form)) {
		return "stale";
	}
	// 메시지 발행 이후 다시 바뀌었으면 최신 상태가 별도 메시지로 반영된다
	if (submission.paid !== message.paid) {
		return "stale";
	}
	await writePaidCell(sheets(), form.sheetName, submission.id, message.paid);
	return "done";
}

export function handleSheetSync(
	message: SheetSyncMessage,
	now: number,
): Promise<SyncOutcome> {
	return message.kind === "upsert"
		? syncUpsert(message, now)
		: syncPaid(message);
}
