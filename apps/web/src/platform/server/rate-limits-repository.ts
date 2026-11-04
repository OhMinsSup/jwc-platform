import { rateLimitBuckets } from "@schema";
import { db, lt, sql } from "void/db";

/**
 * 고정 창 카운터를 원자적으로 1 올리고 현재 창의 횟수를 돌려준다.
 * 창이 지났으면 1부터 다시 센다 (한 문장 upsert라 동시 요청에도 정확하다).
 */
export async function hitBucket(
	key: string,
	now: number,
	windowMs: number,
): Promise<number> {
	const expiredBefore = now - windowMs;
	const [row] = await db
		.insert(rateLimitBuckets)
		.values({ key, count: 1, windowStart: now })
		.onConflictDoUpdate({
			target: rateLimitBuckets.key,
			set: {
				count: sql`case when ${rateLimitBuckets.windowStart} <= ${expiredBefore} then 1 else ${rateLimitBuckets.count} + 1 end`,
				windowStart: sql`case when ${rateLimitBuckets.windowStart} <= ${expiredBefore} then excluded.window_start else ${rateLimitBuckets.windowStart} end`,
			},
		})
		.returning({ count: rateLimitBuckets.count });
	return row?.count ?? 1;
}

/** 오래된 창 정리 (크론) */
export async function deleteBucketsBefore(cutoff: number): Promise<void> {
	await db
		.delete(rateLimitBuckets)
		.where(lt(rateLimitBuckets.windowStart, cutoff));
}
