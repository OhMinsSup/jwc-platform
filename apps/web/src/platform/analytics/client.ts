import { createAnalytics } from "@jwc/analytics";

import {
	CLIENT_EVENTS,
	FEATURE_FLAGS,
	replayAllowedOn,
	sanitizeUrl,
} from "./events";

/** 앱 분석 인스턴스: 카탈로그/정리 규칙(events.ts)을 @jwc/analytics에 넘긴다 */
const analytics = createAnalytics({
	events: CLIENT_EVENTS,
	flags: FEATURE_FLAGS,
	replayFlag: "session-replay",
	replayAllowedOn,
	sanitizeUrl,
});

export const initAnalytics = analytics.init;
export const { track } = analytics;
export const captureClientError = analytics.captureError;
export const { syncReplay } = analytics;
/** 관리자 식별: 사용자 id만 쓴다 (이메일/이름은 보내지 않는다) */
export const identifyAdmin = analytics.identify;
export const resetAnalytics = analytics.reset;
