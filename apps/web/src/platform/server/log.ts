import { createLogger } from "@jwc/observability";

import type { ClassifiedError } from "./errors/classify";
import { SERVER_EVENTS } from "./telemetry/events";

/**
 * 앱 로거: 서버 이벤트 카탈로그(telemetry/events.ts)를 @jwc/observability 로거에 넘긴다.
 * 선언한 필드만 남고, 요청 범위 안이면 requestId가 붙는다.
 */
const logger = createLogger(SERVER_EVENTS);

export const log = {
	info: logger.info,
	warn: logger.warn,
	error: logger.error,
};

/** 분류된 오류를 오류 추적(PostHog $exception)에 보고한다. 오류 카탈로그에서 report=true인 것만 */
export function captureException(
	failure: ClassifiedError,
	operation: string,
): void {
	logger.captureException(
		{
			code: failure.code,
			level: failure.spec.level,
			report: failure.spec.report,
			internalMessage: failure.internalMessage,
		},
		operation,
	);
}
