import { deleteBucketsBefore } from "./rate-limits-repository";
import { LONGEST_WINDOW_MS } from "./security/rate-limit";

/** 지난 창의 속도 제한 카운터를 지운다 (가장 긴 창보다 오래된 것은 더 쓰이지 않는다) */
export async function cleanupRateLimits(now: number): Promise<void> {
	await deleteBucketsBefore(now - LONGEST_WINDOW_MS);
}
