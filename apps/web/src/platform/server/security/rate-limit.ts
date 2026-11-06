import { hmacHex } from "@jwc/common/crypto";
import { createRateLimiter } from "@jwc/security/rate-limit";

import { hitBucket } from "../rate-limits-repository";
import { dataKeys } from "../runtime";
import { RATE_LIMITS } from "./policy";
import type { RateLimitRule } from "./policy";

/** 앱 속도 제한기: 규칙 표(policy.ts) + D1 카운터 + HMAC 대상 (IP 원문은 저장하지 않는다) */
const limiter = createRateLimiter<RateLimitRule>({
	rules: RATE_LIMITS,
	store: { hit: hitBucket },
	hashSubject: async (subject) => {
		const keys = await dataKeys();
		return await hmacHex(keys.identity, `rate:${subject}`);
	},
});

/** 규칙을 넘었으면 RateLimitExceededError (오류 카탈로그: rate_limited, 429) */
export function enforceRateLimit(
	rule: RateLimitRule,
	subject: string,
	now: number,
): Promise<void> {
	return limiter.enforce(rule, subject, now);
}

export const LONGEST_WINDOW_MS = limiter.longestWindowMs;
