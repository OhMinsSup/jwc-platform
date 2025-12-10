import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * 만료된 단축 URL 정리
 * - 매일 자정(UTC 기준)에 실행
 * - 한국 시간으로 오전 9시
 */
crons.daily(
	"cleanup expired short urls",
	{ hourUTC: 0, minuteUTC: 0 },
	internal.shortUrl.cleanupExpired
);

export default crons;
