import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * 미입금 알림 SMS 발송 액션
 * - 미입금자 중에서 아직 3회 이하로 알림을 받지 않은 신청서 조회
 * - 첫 1회는 신청일로부터 3일 후, 첫번째 발송 이후로는 3일 간격으로 발송, ...
 * - 3일에 한번씩 미입금 알림 SMS 발송
 */
crons.daily(
	"send unpaid payment reminders",
	{ hourUTC: 0, minuteUTC: 30 },
	internal.sms.sendPaymentReminder
);

export default crons;
