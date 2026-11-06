import type { PostHog } from "posthog-js";

import { allowedProps, sanitizeUrlProperties } from "./catalog";
import type { EventCatalog, EventProps, FlagCatalog } from "./catalog";

/**
 * 브라우저 PostHog 래퍼 팩토리. 키가 없거나 서버 렌더링 중이면 모든 호출이 아무 일도 하지 않는다.
 * posthog-js는 처음 init할 때 동적으로 불러온다(초기 번들 크기를 늘리지 않는다).
 *
 * 개인정보 기본값: 자동 수집 끔, 익명 프로필 없음, 세션 리플레이는 플래그 + 허용 경로에서만(모든 입력·글자 가림).
 */

export interface AnalyticsConfig {
	host: string;
	key: string;
}

export interface AnalyticsOptions<
	C extends EventCatalog,
	F extends FlagCatalog,
> {
	events: C;
	flags: F;
	/** 세션 리플레이를 켜는 플래그 이름 (없으면 리플레이를 쓰지 않는다) */
	replayFlag?: keyof F & string;
	/** 이 경로에서만 리플레이 허용 */
	replayAllowedOn: (pathname: string) => boolean;
	/** 분석 도구로 보내기 전 URL 정리 (비밀 경로 조각 제거) */
	sanitizeUrl: (url: string) => string;
}

export interface Analytics<C extends EventCatalog, F extends FlagCatalog> {
	captureError: (error: unknown) => void;
	identify: (userId: string) => void;
	init: (config: AnalyticsConfig | null) => void;
	isFeatureEnabled: (flag: keyof F & string) => boolean;
	reset: () => void;
	syncReplay: (pathname: string) => void;
	track: <E extends keyof C & string>(
		event: E,
		props?: EventProps<C, E>,
	) => void;
}

/** posthog.init 옵션: 개인정보 기본값 (자동 수집 끔, 익명 프로필 없음, 리플레이는 꺼진 채 시작하고 모두 가림) */
function initOptions(sanitizeUrl: (url: string) => string) {
	return {
		person_profiles: "identified_only",
		capture_pageview: "history_change",
		capture_pageleave: true,
		autocapture: false,
		capture_exceptions: {
			capture_unhandled_errors: true,
			capture_unhandled_rejections: true,
			capture_console_errors: false,
		},
		disable_session_recording: true,
		session_recording: { maskAllInputs: true, maskTextSelector: "*" },
		before_send: <T extends { properties: Record<string, unknown> }>(
			event: T,
		) => {
			sanitizeUrlProperties(event.properties, sanitizeUrl);
			return event;
		},
	} as const;
}

/** 리플레이 여부를 현재 경로/플래그에 맞춘다 */
function applyReplay(client: PostHog, shouldRecord: boolean): void {
	if (shouldRecord && !client.sessionRecordingStarted()) {
		client.startSessionRecording();
	} else if (!shouldRecord && client.sessionRecordingStarted()) {
		client.stopSessionRecording();
	}
}

export function createAnalytics<C extends EventCatalog, F extends FlagCatalog>(
	options: AnalyticsOptions<C, F>,
): Analytics<C, F> {
	let client: PostHog | null = null;
	let loading: Promise<void> | null = null;

	const isFeatureEnabled = (flag: keyof F & string): boolean =>
		client?.isFeatureEnabled(flag) ?? options.flags[flag]?.default ?? false;

	const syncReplay = (pathname: string): void => {
		if (client) {
			const { replayFlag } = options;
			applyReplay(
				client,
				replayFlag !== undefined &&
					options.replayAllowedOn(pathname) &&
					isFeatureEnabled(replayFlag),
			);
		}
	};

	async function load(config: AnalyticsConfig): Promise<void> {
		const { default: posthog } = await import("posthog-js");
		posthog.init(config.key, {
			api_host: config.host,
			...initOptions(options.sanitizeUrl),
		});
		client = posthog;
		// 플래그는 init 뒤 비동기로 도착한다. 도착하면 현재 화면 기준으로 리플레이 여부를 다시 맞춘다
		posthog.onFeatureFlags(() => {
			syncReplay(window.location.pathname);
		});
	}

	return {
		init: (config) => {
			if (!config || typeof window === "undefined" || loading) {
				return;
			}
			loading = load(config).catch(() => {
				// 분석 도구를 불러오지 못해도 화면은 정상 동작한다
				loading = null;
			});
		},
		isFeatureEnabled,
		syncReplay,
		...delegates(() => client, options.events),
	};
}

/** 클라이언트가 없으면(키 없음, 로딩 전, SSR) 아무것도 하지 않는 단순 위임 */
function delegates<C extends EventCatalog>(
	current: () => PostHog | null,
	events: C,
) {
	return {
		track: <E extends keyof C & string>(
			event: E,
			props: EventProps<C, E> = {},
		) => {
			current()?.capture(event, allowedProps(events, event, props));
		},
		captureError: (error: unknown) => {
			current()?.captureException(error);
		},
		identify: (userId: string) => {
			current()?.identify(userId);
		},
		reset: () => {
			current()?.reset();
		},
	};
}
