-- ADR-0006: submissions(응답 인덱스 + 상태) → submission_keys(유니크 키만).
-- 순서가 중요하다: 옛 message_log는 submissions를 ON DELETE cascade로 참조하므로,
-- submissions를 먼저 지우면 발송 기록이 함께 지워진다. 데이터를 옮기고 참조를 바꾼 뒤 마지막에 지운다.
-- (drizzle-kit 생성본에서 순서와 데이터 복사만 손으로 고쳤다. 최종 스키마는 스냅샷과 같다)
PRAGMA defer_foreign_keys = on;--> statement-breakpoint
CREATE TABLE `submission_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`form_id` text NOT NULL,
	`identity_hash` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`stored_at` integer,
	`write_lock_until` integer,
	FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
-- 시트에 반영된 적이 있는 응답만 저장 완료로 본다 (반영 전이면 다음 제출을 신규로 처리)
INSERT INTO `submission_keys`("id", "form_id", "identity_hash", "revision", "created_at", "stored_at") SELECT "id", "form_id", "identity_hash", "revision", "submitted_at", CASE WHEN "sheet_synced_revision" > 0 THEN "updated_at" ELSE NULL END FROM `submissions`;--> statement-breakpoint
CREATE UNIQUE INDEX `submission_keys_form_identity_uq` ON `submission_keys` (`form_id`,`identity_hash`);--> statement-breakpoint
CREATE INDEX `submission_keys_form_idx` ON `submission_keys` (`form_id`);--> statement-breakpoint
CREATE TABLE `__new_message_log` (
	`id` text PRIMARY KEY NOT NULL,
	`submission_id` text NOT NULL,
	`kind` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`status` text NOT NULL,
	`provider_message_id` text,
	`error` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`submission_id`) REFERENCES `submission_keys`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_message_log`("id", "submission_id", "kind", "idempotency_key", "status", "provider_message_id", "error", "created_at") SELECT "id", "submission_id", "kind", "idempotency_key", "status", "provider_message_id", "error", "created_at" FROM `message_log`;--> statement-breakpoint
DROP TABLE `message_log`;--> statement-breakpoint
ALTER TABLE `__new_message_log` RENAME TO `message_log`;--> statement-breakpoint
CREATE UNIQUE INDEX `message_log_idempotency_uq` ON `message_log` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `message_log_submission_kind_idx` ON `message_log` (`submission_id`,`kind`);--> statement-breakpoint
-- 이제 submissions를 참조하는 표가 없다
DROP TABLE `submissions`;
