import { defineScheduled } from "void";

import { runPaymentReminders } from "../src/features/submissions/server/reminders";
import { cleanupRateLimits } from "../src/platform/server/maintenance";

/** 매일 00:30 UTC = 09:30 KST (Asia/Seoul은 DST 없음). void가 정적으로 읽으므로 리터럴이어야 한다. */
export const cron = "30 0 * * *";

/** 하루 한 번: 미입금 알림 + 지난 속도 제한 카운터 정리 (서로 독립이라 함께 실행) */
export default defineScheduled(async (controller) => {
	await Promise.all([
		runPaymentReminders(controller.scheduledTime),
		cleanupRateLimits(controller.scheduledTime),
	]);
});
