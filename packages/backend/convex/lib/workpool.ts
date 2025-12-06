/**
 * SMS Workpool 설정
 *
 * Solapi SMS 발송을 위한 Workpool 컴포넌트 설정
 */

import { type WorkId, Workpool } from "@convex-dev/workpool";
import { components } from "../_generated/api";

/**
 * SMS 발송을 위한 Workpool 인스턴스
 *
 * - maxParallelism: 동시 발송 제한 (Solapi rate limit 고려)
 * - retryActionsByDefault: 실패 시 자동 재시도
 * - defaultRetryBehavior: 재시도 설정 (최대 3회, 지수 백오프)
 */
export const smsPool = new Workpool(components.smsWorkpool, {
	maxParallelism: 5, // 동시에 최대 5개 SMS 발송
	retryActionsByDefault: true,
	defaultRetryBehavior: {
		maxAttempts: 3,
		initialBackoffMs: 1000, // 첫 재시도까지 1초
		base: 2, // 지수 백오프 (1초 -> 2초 -> 4초)
	},
	logLevel: "INFO",
});

// Re-export types
export type { WorkId };
