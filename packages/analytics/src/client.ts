import type { PostHog } from "posthog-js";

import { allowedProps, sanitizeUrlProperties } from "./catalog";
import type { EventCatalog, EventProps, FlagCatalog } from "./catalog";
import {
	PERFORMANCE_CAPTURE,
	sanitizePerformanceProperties,
} from "./performance";

/**
 * 브라우저 PostHog 래퍼 팩토리. 키가 없거나 서버 렌더링 중이면 모든 호출이 아무 일도 하지 않는다.
 * posthog-js는 처음 init할 때 동적으로 불러온다(초기 번들 크기를 늘리지 않는다).
 * 불러오는 동안의 호출은 순서대로 모아 뒀다가 로드 직후 보낸다(첫 화면 이벤트가 사라지지 않게).
 *
 * 개인정보 기본값: 클릭 자동 수집 끔, 익명 프로필 없음, 성능 숫자만 수집하고 상세 DOM 정보는 버린다.
 * 세션 리플레이는 플래그 + 허용 경로에서만(모든 입력·글자 가림).
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

/** 개인정보 기본값: 클릭 자동 수집 끔, 성능 숫자만 수집, 리플레이는 꺼진 채 시작하고 모두 가림. */
function initOptions(sanitizeUrl: (url: string) => string) {
	return {
		person_profiles: "identified_only",
		capture_pageview: "history_change",
		capture_pageleave: true,
		autocapture: false,
		capture_performance: PERFORMANCE_CAPTURE,
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
			sanitizePerformanceProperties(event.properties);
			return event;
		},
	} as const;
}

/**
 * posthog-js를 불러오는 동안 들어온 호출을 모아 두는 최대 개수.
 * 첫 화면의 노출·식별 이벤트는 로딩이 끝나기 전에 불리므로 모아 뒀다 보낸다. 상한을 넘으면 버린다.
 */
const MAX_PENDING_CALLS = 50;

type ClientCall = (client: PostHog) => void;

/** 리플레이 여부를 현재 경로/플래그에 맞춘다 */
function applyReplay(client: PostHog, shouldRecord: boolean): void {
	if (shouldRecord && !client.sessionRecordingStarted()) {
		client.startSessionRecording();
	} else if (!shouldRecord && client.sessionRecordingStarted()) {
		client.stopSessionRecording();
	}
}

/**
 * posthog 인스턴스 자리. 불러오는 중에는 호출을 순서대로 모아 두고, 불러오면 바로 실행한다.
 * 불러오기 전(키 없음·SSR)이나 실패한 뒤의 호출은 버린다.
 */
function createClientSlot() {
	let client: PostHog | null = null;
	let loading = false;
	let pending: ClientCall[] = [];
	return {
		current: () => client,
		/** 불러오는 중이거나 이미 불러왔으면 true (init은 한 번만) */
		started: () => loading,
		start: () => {
			loading = true;
		},
		ready: (next: PostHog) => {
			client = next;
			const queued = pending;
			pending = [];
			for (const call of queued) {
				call(next);
			}
		},
		fail: () => {
			loading = false;
			pending = [];
		},
		run: (call: ClientCall) => {
			if (client) {
				call(client);
			} else if (loading && pending.length < MAX_PENDING_CALLS) {
				pending.push(call);
			}
		},
	};
}

export function createAnalytics<C extends EventCatalog, F extends FlagCatalog>(
	options: AnalyticsOptions<C, F>,
): Analytics<C, F> {
	const slot = createClientSlot();

	const isFeatureEnabled = (flag: keyof F & string): boolean =>
		slot.current()?.isFeatureEnabled(flag) ??
		options.flags[flag]?.default ??
		false;

	const syncReplay = (pathname: string): void => {
		const client = slot.current();
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
		slot.ready(posthog);
		// 플래그는 init 뒤 비동기로 도착한다. 도착하면 현재 화면 기준으로 리플레이 여부를 다시 맞춘다
		posthog.onFeatureFlags(() => {
			syncReplay(window.location.pathname);
		});
	}

	return {
		init: (config) => {
			if (!config || typeof window === "undefined" || slot.started()) {
				return;
			}
			slot.start();
			void load(config).catch(() => {
				// 분석 도구를 불러오지 못해도 화면은 정상 동작한다 (다음 init에서 다시 시도)
				slot.fail();
			});
		},
		isFeatureEnabled,
		syncReplay,
		...delegates(slot.run, options.events),
	};
}

/** 클라이언트 호출 위임. 언제 실행할지(바로/모아 두기/버리기)는 run이 정한다 */
function delegates<C extends EventCatalog>(
	run: (call: ClientCall) => void,
	events: C,
) {
	return {
		track: <E extends keyof C & string>(
			event: E,
			props: EventProps<C, E> = {},
		) => {
			// 속성은 부른 시점에 걸러 둔다 (나중에 props 객체가 바뀌어도 영향받지 않게)
			const allowed = allowedProps(events, event, props);
			run((client) => client.capture(event, allowed));
		},
		captureError: (error: unknown) => {
			run((client) => client.captureException(error));
		},
		identify: (userId: string) => {
			run((client) => client.identify(userId));
		},
		reset: () => {
			run((client) => client.reset());
		},
	};
}
