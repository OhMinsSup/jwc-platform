import type { PostHogConfig } from "posthog-js";

/** 실제 사용자 지표만 수집한다. DOM·입력 요소 attribution과 실험적 soft navigation은 사용하지 않는다. */
export const PERFORMANCE_CAPTURE = {
	web_vitals: true,
	web_vitals_allowed_metrics: ["LCP", "INP", "CLS"],
	web_vitals_attribution: false,
} satisfies Exclude<PostHogConfig["capture_performance"], boolean | undefined>;

/** 숫자 *_value만 필요하다. SDK의 상세 이벤트에는 중첩 URL·DOM·원본 entries가 들어갈 수 있다. */
export function sanitizePerformanceProperties(
	properties: Record<string, unknown>,
): void {
	delete properties.$web_vitals_LCP_event;
	delete properties.$web_vitals_INP_event;
	delete properties.$web_vitals_CLS_event;
	delete properties.$web_vitals_FCP_event;
}
