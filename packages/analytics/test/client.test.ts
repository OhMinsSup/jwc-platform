import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vite-plus/test";

import { createAnalytics } from "../src/client";

/** posthog-js 가짜: 실제 네트워크 없이 호출만 기록한다 */
const posthog = vi.hoisted(() => ({
	init: vi.fn<(key: string, options: unknown) => void>(),
	capture: vi.fn<(event: string, props: unknown) => void>(),
	identify: vi.fn<(userId: string) => void>(),
	captureException: vi.fn<(error: unknown) => void>(),
	reset: vi.fn<() => void>(),
	onFeatureFlags: vi.fn<(callback: () => void) => void>(),
	isFeatureEnabled: vi.fn<(flag: string) => boolean>(() => false),
	sessionRecordingStarted: vi.fn<() => boolean>(() => false),
	startSessionRecording: vi.fn<() => void>(),
	stopSessionRecording: vi.fn<() => void>(),
}));

// oxlint-disable-next-line vitest/prefer-import-in-mock -- 가짜는 래퍼가 쓰는 메서드만 둔다 (import 형태는 PostHog 전체 타입을 요구한다)
vi.mock("posthog-js", () => ({ default: posthog }));

const CONFIG = { key: "phc_test", host: "https://ph.example.test" };
const EVENTS = { viewed: ["slug"] } as const;

function makeAnalytics() {
	return createAnalytics({
		events: EVENTS,
		flags: {},
		replayAllowedOn: () => false,
		sanitizeUrl: (url) => url,
	});
}

/** 동적 import와 그 뒤의 처리가 끝날 때까지 기다린다 */
async function settle() {
	await vi.dynamicImportSettled();
	await Promise.resolve();
}

describe(createAnalytics, () => {
	beforeEach(() => {
		vi.stubGlobal("window", { location: { pathname: "/" } });
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("init 직후(로딩 중)에 부른 track·identify도 로드가 끝나면 보낸다", async () => {
		const analytics = makeAnalytics();
		analytics.init(CONFIG);
		analytics.track("viewed", { slug: "retreat" });
		analytics.identify("admin-1");
		expect(posthog.capture).not.toHaveBeenCalled();

		await settle();

		expect(posthog.capture).toHaveBeenCalledWith("viewed", { slug: "retreat" });
		expect(posthog.identify).toHaveBeenCalledWith("admin-1");
		// 부른 순서를 지킨다
		expect(posthog.capture.mock.invocationCallOrder[0]).toBeLessThan(
			posthog.identify.mock.invocationCallOrder[0] ?? 0,
		);
	});

	it("로드가 끝난 뒤의 호출은 바로 보낸다", async () => {
		const analytics = makeAnalytics();
		analytics.init(CONFIG);
		await settle();
		analytics.track("viewed", { slug: "camp" });
		expect(posthog.capture).toHaveBeenCalledWith("viewed", { slug: "camp" });
	});

	it("키가 없으면(init(null)) 호출을 모아 두지 않고 버린다", async () => {
		const analytics = makeAnalytics();
		analytics.init(null);
		analytics.track("viewed", { slug: "retreat" });
		analytics.init(CONFIG);
		await settle();
		expect(posthog.capture).not.toHaveBeenCalled();
	});

	it("로딩 중 모아 두는 호출 수에 상한이 있다", async () => {
		const analytics = makeAnalytics();
		analytics.init(CONFIG);
		for (let index = 0; index < 1000; index += 1) {
			analytics.track("viewed", { slug: String(index) });
		}
		await settle();
		expect(posthog.capture.mock.calls.length).toBeLessThan(1000);
		expect(posthog.capture).toHaveBeenCalledWith("viewed", { slug: "0" });
	});
});
