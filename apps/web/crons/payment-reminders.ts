import { defineScheduled } from "void";

import { runPaymentReminders } from "../src/server/services/reminders";

/** 매일 00:30 UTC = 09:30 KST (Asia/Seoul은 DST 없음). void가 정적으로 읽으므로 리터럴이어야 한다. */
export const cron = "30 0 * * *";

export default defineScheduled(async (controller) => {
	await runPaymentReminders(controller.scheduledTime);
});
