import { index, integer, sqliteTable, text, uniqueIndex } from "void/schema-d1";

import { forms, formVersions } from "./forms";

/**
 * 응답 "인덱스". 답변 본문은 Google Sheets가 원본이며 여기에는 저장하지 않는다.
 * 시트가 못 하는 일(유니크 판정, 납입/알림 상태, 암호화된 연락처 보관)만 담당한다.
 */
export const submissions = sqliteTable(
	"submissions",
	{
		id: text("id").primaryKey(),
		formId: text("form_id")
			.notNull()
			.references(() => forms.id, { onDelete: "cascade" }),
		formVersionId: text("form_version_id")
			.notNull()
			.references(() => formVersions.id),
		/** identity 필드 정규화 값의 HMAC (원문 복원 불가) */
		identityHash: text("identity_hash").notNull(),
		/** 연락처 AES-GCM 암호문 (SMS 발송용). contact 설정이 없으면 null */
		contactCipher: text("contact_cipher"),
		paid: integer("paid", { mode: "boolean" }).notNull().default(false),
		/** 제출/수정마다 1씩 증가. 시트 쓰기 순서 보장에 사용 */
		revision: integer("revision").notNull().default(1),
		/** 시트에 반영 완료된 revision */
		sheetSyncedRevision: integer("sheet_synced_revision").notNull().default(0),
		/** 시트 동기화 임대 락 만료 시각 (동일 응답 동시 쓰기 방지) */
		syncLockUntil: integer("sync_lock_until"),
		reminderCount: integer("reminder_count").notNull().default(0),
		reminderLastAt: integer("reminder_last_at"),
		submittedAt: integer("submitted_at").notNull(),
		updatedAt: integer("updated_at").notNull(),
	},
	(table) => [
		uniqueIndex("submissions_form_identity_uq").on(
			table.formId,
			table.identityHash,
		),
		index("submissions_form_paid_idx").on(table.formId, table.paid),
	],
);

/** SMS 발송 이력. idempotencyKey로 중복 발송을 막는다 (큐는 at-least-once). */
export const messageLog = sqliteTable(
	"message_log",
	{
		id: text("id").primaryKey(),
		submissionId: text("submission_id")
			.notNull()
			.references(() => submissions.id, { onDelete: "cascade" }),
		kind: text("kind", {
			enum: ["onCreate", "onUpdate", "onReminder"],
		}).notNull(),
		idempotencyKey: text("idempotency_key").notNull(),
		status: text("status", { enum: ["sent", "logged", "failed"] }).notNull(),
		providerMessageId: text("provider_message_id"),
		error: text("error"),
		createdAt: integer("created_at").notNull(),
	},
	(table) => [
		uniqueIndex("message_log_idempotency_uq").on(table.idempotencyKey),
	],
);
