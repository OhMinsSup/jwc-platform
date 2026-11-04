import { messageLog, submissions } from "@schema";
import { and, db, eq, isNull, lt, or, sql } from "void/db";

export type SubmissionRow = typeof submissions.$inferSelect;

export interface UpsertSubmissionInput {
	contactCipher: string | null;
	formId: string;
	formVersionId: string;
	id: string;
	identityHash: string;
	now: number;
}

/**
 * (formId, identityHash) 기준 원자적 upsert. 재제출이면 revision을 올리고 납입 상태는 보존한다.
 * revision === 1 이면 신규.
 */
export async function upsertSubmission(
	input: UpsertSubmissionInput,
): Promise<{ id: string; revision: number }> {
	const [row] = await db
		.insert(submissions)
		.values({
			id: input.id,
			formId: input.formId,
			formVersionId: input.formVersionId,
			identityHash: input.identityHash,
			contactCipher: input.contactCipher,
			submittedAt: input.now,
			updatedAt: input.now,
		})
		.onConflictDoUpdate({
			target: [submissions.formId, submissions.identityHash],
			set: {
				formVersionId: input.formVersionId,
				contactCipher: input.contactCipher,
				revision: sql`${submissions.revision} + 1`,
				updatedAt: input.now,
			},
		})
		.returning({ id: submissions.id, revision: submissions.revision });
	if (!row) {
		throw new Error("submission upsert가 행을 반환하지 않았습니다");
	}
	return row;
}

export async function findSubmission(
	id: string,
): Promise<SubmissionRow | undefined> {
	return await db
		.select()
		.from(submissions)
		.where(eq(submissions.id, id))
		.get();
}

export async function listSubmissions(
	formId: string,
): Promise<SubmissionRow[]> {
	return await db
		.select()
		.from(submissions)
		.where(eq(submissions.formId, formId))
		.orderBy(submissions.submittedAt);
}

export async function listUnpaid(formId: string): Promise<SubmissionRow[]> {
	return await db
		.select()
		.from(submissions)
		.where(and(eq(submissions.formId, formId), eq(submissions.paid, false)));
}

/** 임대 락 획득. 다른 워커가 같은 응답을 쓰는 중이면 false */
export async function acquireSyncLock(
	id: string,
	now: number,
	ttlMs: number,
): Promise<boolean> {
	const rows = await db
		.update(submissions)
		.set({ syncLockUntil: now + ttlMs })
		.where(
			and(
				eq(submissions.id, id),
				or(
					isNull(submissions.syncLockUntil),
					lt(submissions.syncLockUntil, now),
				),
			),
		)
		.returning({ id: submissions.id });
	return rows.length === 1;
}

export async function completeSync(
	id: string,
	revision: number,
): Promise<void> {
	await db
		.update(submissions)
		.set({
			sheetSyncedRevision: sql`max(${submissions.sheetSyncedRevision}, ${revision})`,
			syncLockUntil: null,
		})
		.where(eq(submissions.id, id));
}

export async function releaseSyncLock(id: string): Promise<void> {
	await db
		.update(submissions)
		.set({ syncLockUntil: null })
		.where(eq(submissions.id, id));
}

export async function setPaid(
	id: string,
	paid: boolean,
	now: number,
): Promise<void> {
	await db
		.update(submissions)
		.set({ paid, updatedAt: now })
		.where(eq(submissions.id, id));
}

export async function updateIdentity(
	id: string,
	patch: { identityHash?: string; contactCipher?: string },
): Promise<void> {
	if (patch.identityHash === undefined && patch.contactCipher === undefined) {
		return;
	}
	await db.update(submissions).set(patch).where(eq(submissions.id, id));
}

export type MessageLogInsert = typeof messageLog.$inferInsert;

export async function findMessageByKey(idempotencyKey: string) {
	return await db
		.select()
		.from(messageLog)
		.where(eq(messageLog.idempotencyKey, idempotencyKey))
		.get();
}

/**
 * 발송 기록과 (미입금 알림이면) 알림 횟수 증가를 한 batch로 처리한다.
 * 둘이 어긋나면 같은 idempotencyKey가 영원히 건너뛰어지는 문제가 생기기 때문.
 */
export async function recordDelivery(
	row: MessageLogInsert,
	now: number,
): Promise<void> {
	const insert = db
		.insert(messageLog)
		.values(row)
		.onConflictDoNothing({ target: messageLog.idempotencyKey });
	if (row.kind !== "onReminder") {
		await insert;
		return;
	}
	await db.batch([
		insert,
		db
			.update(submissions)
			.set({
				reminderCount: sql`${submissions.reminderCount} + 1`,
				reminderLastAt: now,
			})
			.where(eq(submissions.id, row.submissionId)),
	]);
}
