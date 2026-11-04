import { index, integer, sqliteTable, text, uniqueIndex } from "void/schema-d1";

/**
 * D1 스키마 (단일 모듈). void가 이 파일을 drizzle 스키마로 읽고 `@schema`로 연결한다.
 * 묶음(배럴) 파일을 두지 않기 위해 표 정의를 한 파일에 둔다 (ADR-0007).
 * 표: Better Auth 코어 / 폼·버전 / 응답 키·발송 기록 / 보안(속도 제한·초대·감사)
 */

/* ───────── auth ───────── */

/**
 * Better Auth 코어 테이블 (sqlite).
 * 컬럼 구성은 Better Auth 1.7 drizzle 어댑터 기대값과 일치해야 한다.
 * 변경 시 `pnpm auth:schema`로 생성한 결과와 비교할 것.
 */
const timestamps = {
	createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
};

export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: integer("email_verified", { mode: "boolean" })
		.notNull()
		.default(false),
	image: text("image"),
	...timestamps,
});

export const session = sqliteTable(
	"session",
	{
		id: text("id").primaryKey(),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
		token: text("token").notNull().unique(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		...timestamps,
	},
	(table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = sqliteTable(
	"account",
	{
		id: text("id").primaryKey(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: integer("access_token_expires_at", {
			mode: "timestamp_ms",
		}),
		refreshTokenExpiresAt: integer("refresh_token_expires_at", {
			mode: "timestamp_ms",
		}),
		scope: text("scope"),
		password: text("password"),
		...timestamps,
	},
	(table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = sqliteTable(
	"verification",
	{
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
		...timestamps,
	},
	(table) => [index("verification_identifier_idx").on(table.identifier)],
);

/* ───────── forms ───────── */

/**
 * 폼 구성 데이터는 DB(D1)에 둔다.
 * - forms: 편집 중인 초안(draft)과 현재 발행 버전 포인터
 * - form_versions: 발행된 정의 스냅샷 (불변)
 */
export const forms = sqliteTable("forms", {
	id: text("id").primaryKey(),
	slug: text("slug").notNull().unique(),
	/** draft | open | closed */
	status: text("status", { enum: ["draft", "open", "closed"] })
		.notNull()
		.default("draft"),
	/** 편집 중인 정의 JSON (검증 전일 수 있음) */
	draftDefinition: text("draft_definition", { mode: "json" }).notNull(),
	publishedVersionId: text("published_version_id"),
	/** 응답이 저장되는 시트 탭 이름 */
	sheetName: text("sheet_name").notNull().unique(),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
});

export const formVersions = sqliteTable(
	"form_versions",
	{
		id: text("id").primaryKey(),
		formId: text("form_id")
			.notNull()
			.references(() => forms.id, { onDelete: "cascade" }),
		version: integer("version").notNull(),
		/** 검증을 통과한 FormDefinition JSON. 발행 후 절대 수정하지 않는다. */
		definition: text("definition", { mode: "json" }).notNull(),
		publishedAt: integer("published_at").notNull(),
		publishedBy: text("published_by").notNull(),
	},
	(table) => [
		uniqueIndex("form_versions_form_version_uq").on(
			table.formId,
			table.version,
		),
	],
);

/* ───────── submissions ───────── */

/**
 * 응답 "키". 답변과 상태(납입 여부 등)는 응답 저장소(SubmissionStore, 기본 Google Sheets)가 원본이다.
 * 여기에는 저장소가 못 하는 일만 둔다: 원자적 유니크 판정(폼 + 식별값), 알림 멱등 키용 revision,
 * 같은 응답의 동시 쓰기를 막는 임대 락. 답변/연락처/납입 여부는 저장하지 않는다.
 */
export const submissionKeys = sqliteTable(
	"submission_keys",
	{
		id: text("id").primaryKey(),
		formId: text("form_id")
			.notNull()
			.references(() => forms.id, { onDelete: "cascade" }),
		/** identity 필드 정규화 값의 HMAC (원문 복원 불가) */
		identityHash: text("identity_hash").notNull(),
		/** 제출/수정마다 1씩 증가. 알림 멱등 키에 쓴다 */
		revision: integer("revision").notNull().default(1),
		/** 처음 키를 만든 시각 = 최초 제출 시각 */
		createdAt: integer("created_at").notNull(),
		/** 저장소에 처음 저장된 시각. null이면 키만 있고 저장 전 실패한 상태(다음 제출을 신규로 본다) */
		storedAt: integer("stored_at"),
		/** 저장소 쓰기 임대 락 만료 시각 (같은 응답 동시 쓰기 방지) */
		writeLockUntil: integer("write_lock_until"),
	},
	(table) => [
		uniqueIndex("submission_keys_form_identity_uq").on(
			table.formId,
			table.identityHash,
		),
		index("submission_keys_form_idx").on(table.formId),
	],
);

/**
 * SMS 발송 사실. idempotencyKey로 중복 발송을 막는다 (큐는 at-least-once).
 * 미입금 알림 횟수/마지막 시각은 이 표에서 파생한다(별도 카운터를 두지 않는다).
 */
export const messageLog = sqliteTable(
	"message_log",
	{
		id: text("id").primaryKey(),
		submissionId: text("submission_id")
			.notNull()
			.references(() => submissionKeys.id, { onDelete: "cascade" }),
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
		index("message_log_submission_kind_idx").on(table.submissionId, table.kind),
	],
);

/* ───────── security ───────── */

/**
 * 고정 창(fixed window) 요청 수 제한. 키는 `<규칙>:<대상 해시>` (IP 원문은 저장하지 않는다).
 * 만료된 행은 크론이 지운다.
 */
export const rateLimitBuckets = sqliteTable(
	"rate_limit_buckets",
	{
		key: text("key").primaryKey(),
		count: integer("count").notNull(),
		windowStart: integer("window_start").notNull(),
	},
	(table) => [index("rate_limit_buckets_window_idx").on(table.windowStart)],
);

/**
 * 관리자 초대. 코드는 해시만 저장하고(원문은 만들 때 한 번만 보여 준다) 이메일에 묶인 1회용이다.
 * 가입은 유효한 초대(또는 첫 관리자 부트스트랩)로만 가능하다.
 */
export const adminInvites = sqliteTable(
	"admin_invites",
	{
		id: text("id").primaryKey(),
		/** HMAC(코드) */
		codeHash: text("code_hash").notNull().unique(),
		/** 소문자로 정규화한 이메일 */
		email: text("email").notNull(),
		createdBy: text("created_by")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		createdAt: integer("created_at").notNull(),
		expiresAt: integer("expires_at").notNull(),
		/** 사용(가입 완료) 시각. null이면 미사용 */
		usedAt: integer("used_at"),
	},
	(table) => [index("admin_invites_email_idx").on(table.email)],
);

/**
 * 관리자 작업 감사 기록. 개인정보(답변, 연락처)는 남기지 않고 대상 id와 작업 종류만 남긴다.
 */
export const auditLog = sqliteTable(
	"audit_log",
	{
		id: text("id").primaryKey(),
		/** 작업한 관리자 user.id (탈퇴해도 기록은 남긴다: FK 없음) */
		actorId: text("actor_id").notNull(),
		action: text("action").notNull(),
		targetType: text("target_type").notNull(),
		targetId: text("target_id").notNull(),
		/** 작업 요약 (원시값만, 개인정보 금지) */
		detail: text("detail", { mode: "json" }),
		requestId: text("request_id"),
		at: integer("at").notNull(),
	},
	(table) => [index("audit_log_at_idx").on(table.at)],
);
