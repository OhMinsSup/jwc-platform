/**
 * 서버 이벤트 카탈로그 (데이터). 이벤트마다 남길 수 있는 필드를 선언한다.
 * - 로그와 PostHog는 선언된 필드만 내보낸다(허용 목록, @jwc/observability). 선언하지 않은 키는 타입 오류이고, 런타임에도 버린다.
 * - 필드 값은 원시값(문자열/숫자/불리언/null)만. 답변, 전화번호, 이름, 문자 본문, 토큰은 필드로 두지 않는다.
 * - analytics: PostHog에 제품 이벤트로도 보낸다 (이름은 snake_case 그대로).
 */

import type { EventCatalog } from "@jwc/observability/catalog";

export const SERVER_EVENTS = {
	"submission.stored": {
		fields: ["formId", "submissionId", "revision", "isNew"],
		analytics: true,
	},
	"submission.paid_changed": {
		fields: ["submissionId", "paid"],
		analytics: true,
	},
	"notification.enqueue_failed": {
		fields: ["submissionId", "kind", "code", "error"],
	},
	"form.published": { fields: ["formId", "version"], analytics: true },
	"definition.corrupted": { fields: ["formId", "versionId", "issues"] },
	"sms.delivered": {
		fields: ["submissionId", "kind", "mode"],
		analytics: true,
	},
	"sms.processed": { fields: ["submissionId", "kind", "result", "traceId"] },
	"sms.failed": {
		fields: ["submissionId", "kind", "code", "attempts", "error", "traceId"],
	},
	"admin.invite_created": { fields: ["inviteId"], analytics: true },
	"admin.signed_up": { fields: ["userId", "path"], analytics: true },
	/** reason = 내부 거절 사유, authCode = Better Auth 오류 코드 (이메일/코드는 남기지 않는다) */
	"admin.signup_rejected": { fields: ["reason", "authCode"] },
	"audit.record_failed": { fields: ["action", "code", "error"] },
	"server_fn.failed": { fields: ["operation", "code", "error"] },
	"scheduled.unknown_cron": { fields: ["cron"] },
	"queue.unknown": { fields: ["queue", "size"] },
	"telemetry.flush_failed": { fields: ["status", "error"] },
} as const satisfies EventCatalog;
