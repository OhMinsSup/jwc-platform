import { messageLog, submissionKeys } from "@schema";
import {
	and,
	count,
	db,
	eq,
	inArray,
	isNotNull,
	isNull,
	lt,
	max,
	or,
	sql,
} from "void/db";

/**
 * 응답 키(D1). 답변/상태는 응답 저장소가 원본이고, 여기에는 유니크·멱등·동시성 제어만 둔다.
 */

export type SubmissionKeyRow = typeof submissionKeys.$inferSelect;

export interface ClaimedKey {
	createdAt: number;
	id: string;
	revision: number;
	/** 저장소에 처음 저장된 시각. null이면 아직 한 번도 저장되지 않았다 */
	storedAt: number | null;
}

/**
 * (formId, identityHash) 기준 원자적 claim. 없으면 새 키(revision 1), 있으면 revision을 올린다.
 * 같은 식별값이 동시에 들어와도 D1 유니크 인덱스가 키를 하나로 만든다.
 */
export async function claimKey(input: {
	formId: string;
	id: string;
	identityHash: string;
	now: number;
}): Promise<ClaimedKey> {
	const [row] = await db
		.insert(submissionKeys)
		.values({
			id: input.id,
			formId: input.formId,
			identityHash: input.identityHash,
			createdAt: input.now,
		})
		.onConflictDoUpdate({
			target: [submissionKeys.formId, submissionKeys.identityHash],
			set: { revision: sql`${submissionKeys.revision} + 1` },
		})
		.returning({
			id: submissionKeys.id,
			revision: submissionKeys.revision,
			createdAt: submissionKeys.createdAt,
			storedAt: submissionKeys.storedAt,
		});
	if (!row) {
		throw new Error("submission_keys claim이 행을 반환하지 않았습니다");
	}
	return row;
}

/** 저장소에 저장된 적 있는 키인지 (없거나 저장 전 실패한 키는 응답이 존재하지 않는다) */
export function isStoredKey(
	key: SubmissionKeyRow | undefined,
): key is SubmissionKeyRow & { storedAt: number } {
	return key !== undefined && key.storedAt !== null;
}

export async function findKey(
	id: string,
): Promise<SubmissionKeyRow | undefined> {
	return await db
		.select()
		.from(submissionKeys)
		.where(eq(submissionKeys.id, id))
		.get();
}

/** 저장소에 한 번이라도 저장된 키 (목록/알림 대상) */
export async function listStoredKeys(
	formId: string,
): Promise<SubmissionKeyRow[]> {
	return await db
		.select()
		.from(submissionKeys)
		.where(
			and(
				eq(submissionKeys.formId, formId),
				isNotNull(submissionKeys.storedAt),
			),
		);
}

/** 쓰기 임대 락 획득. 다른 요청이 같은 응답을 쓰는 중이면 false */
export async function acquireWriteLock(
	id: string,
	now: number,
	ttlMs: number,
): Promise<boolean> {
	const rows = await db
		.update(submissionKeys)
		.set({ writeLockUntil: now + ttlMs })
		.where(
			and(
				eq(submissionKeys.id, id),
				or(
					isNull(submissionKeys.writeLockUntil),
					lt(submissionKeys.writeLockUntil, now),
				),
			),
		)
		.returning({ id: submissionKeys.id });
	return rows.length === 1;
}

/** 저장 성공: 첫 저장 시각을 남기고(이미 있으면 유지) 락을 푼다 */
export async function markStored(id: string, now: number): Promise<void> {
	await db
		.update(submissionKeys)
		.set({
			storedAt: sql`coalesce(${submissionKeys.storedAt}, ${now})`,
			writeLockUntil: null,
		})
		.where(eq(submissionKeys.id, id));
}

export async function releaseWriteLock(id: string): Promise<void> {
	await db
		.update(submissionKeys)
		.set({ writeLockUntil: null })
		.where(eq(submissionKeys.id, id));
}

export interface ReminderHistory {
	lastSentAt: number | null;
	sentCount: number;
}

/** 미입금 알림 이력은 발송 사실(message_log)에서 파생한다 */
export async function reminderHistory(
	submissionIds: readonly string[],
): Promise<Map<string, ReminderHistory>> {
	if (submissionIds.length === 0) {
		return new Map();
	}
	const rows = await db
		.select({
			submissionId: messageLog.submissionId,
			sentCount: count(),
			lastSentAt: max(messageLog.createdAt),
		})
		.from(messageLog)
		.where(
			and(
				inArray(messageLog.submissionId, [...submissionIds]),
				eq(messageLog.kind, "onReminder"),
				inArray(messageLog.status, ["sent", "logged"]),
			),
		)
		.groupBy(messageLog.submissionId);
	return new Map(
		rows.map((row) => [
			row.submissionId,
			{ sentCount: row.sentCount, lastSentAt: row.lastSentAt },
		]),
	);
}

export type MessageLogInsert = typeof messageLog.$inferInsert;

export async function findMessageByKey(idempotencyKey: string) {
	return await db
		.select()
		.from(messageLog)
		.where(eq(messageLog.idempotencyKey, idempotencyKey))
		.get();
}

/** 발송 사실 기록 (같은 멱등 키는 한 번만) */
export async function recordDelivery(row: MessageLogInsert): Promise<void> {
	await db
		.insert(messageLog)
		.values(row)
		.onConflictDoNothing({ target: messageLog.idempotencyKey });
}
