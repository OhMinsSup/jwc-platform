import { createServerFn } from "@tanstack/react-start";

import { posthogConfig, turnstileConfig } from "../server/runtime";

/**
 * 브라우저에 넘기는 공개 설정. PostHog 프로젝트 키(phc_)는 원래 공개 키다.
 * 비밀값은 여기에 넣지 않는다.
 */
export const getClientConfigFn = createServerFn({ method: "GET" }).handler(
	() => {
		const posthog = posthogConfig();
		return {
			analytics: posthog ? { key: posthog.apiKey, host: posthog.host } : null,
			/** Turnstile 사이트 키(공개). 없으면 위젯을 그리지 않는다 */
			turnstileSiteKey: turnstileConfig()?.siteKey ?? null,
		};
	},
);
