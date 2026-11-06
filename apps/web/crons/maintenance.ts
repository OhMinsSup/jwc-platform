import { defineScheduled } from "void";

import { cleanupRateLimits } from "../src/platform/server/maintenance";

/** 매일 00:30 UTC = 09:30 KST (Asia/Seoul은 DST 없음). void가 정적으로 읽으므로 리터럴이어야 한다. */
export const cron = "30 0 * * *";

/** 지난 속도 제한 카운터만 정리한다. 신청자에게 문자를 보내지 않는다. */
export default defineScheduled(async (controller) => {
	await cleanupRateLimits(controller.scheduledTime);
});
