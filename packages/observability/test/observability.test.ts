import { jsonBody, recordingFetch } from "@jwc/common/testing";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import { allowedFields } from "../src/catalog";
import type { EventCatalog } from "../src/catalog";
import { createLogger } from "../src/logger";
import { distinctIdFromCookie, flushToPostHog } from "../src/posthog";
import { createScope, runInScope } from "../src/scope";
import { observeTask } from "../src/worker";

const CATALOG = {
	"order.placed": { fields: ["orderId", "isNew"], analytics: true },
	"job.failed": { fields: ["error"] },
} as const satisfies EventCatalog;

const KEY = "phc_test";
const CONFIG = { apiKey: KEY, host: "https://ph.example" };

describe(allowedFields, () => {
	it("선언된 필드만 남긴다 (타입을 우회해 넣은 값도 버린다)", () => {
		const fields: Record<string, unknown> = {
			orderId: "o1",
			answers: { name: "홍길동" },
		};
		expect(allowedFields(CATALOG, "order.placed", fields)).toStrictEqual({
			orderId: "o1",
		});
	});

	it("문자열 속 전화번호처럼 보이는 값을 가린다", () => {
		const safe = allowedFields(CATALOG, "job.failed", {
			error: "invalid phone 010-1234-5678 / 01098765432",
		});
		expect(safe.error).toBe("invalid phone [phone] / [phone]");
	});
});

describe(distinctIdFromCookie, () => {
	it("브라우저 PostHog 쿠키에서 익명 id를 읽는다", () => {
		const value = encodeURIComponent(JSON.stringify({ distinct_id: "anon-1" }));
		expect(distinctIdFromCookie(`a=1; ph_${KEY}_posthog=${value}`, KEY)).toBe(
			"anon-1",
		);
	});

	it("쿠키가 없거나 형식이 다르면 null", () => {
		expect(distinctIdFromCookie(null, KEY)).toBeNull();
		expect(distinctIdFromCookie(`ph_${KEY}_posthog=%7Bbad`, KEY)).toBeNull();
		expect(distinctIdFromCookie("ph_other_posthog=x", KEY)).toBeNull();
	});
});

describe(createLogger, () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("범위 안의 로그에는 requestId가 붙고, analytics 이벤트는 버퍼에 쌓인다", () => {
		const lines: string[] = [];
		vi.spyOn(console, "log").mockImplementation((line: string) => {
			lines.push(line);
		});
		vi.spyOn(console, "error").mockReturnValue(undefined);
		const log = createLogger(CATALOG);
		const scope = createScope("req-1", "anon-1");
		runInScope(scope, () => {
			log.info("order.placed", { orderId: "o1", isNew: true });
			log.error("job.failed", { error: "x" });
		});
		expect(JSON.parse(lines[0] ?? "{}")).toMatchObject({
			event: "order.placed",
			requestId: "req-1",
			orderId: "o1",
		});
		expect(scope.captured.map((event) => event.event)).toStrictEqual([
			"order_placed",
		]);
	});

	it("보고 대상 실패만 $exception으로 쌓고, 내부 문장도 정리한다", () => {
		const log = createLogger(CATALOG);
		const scope = createScope("req-2");
		runInScope(scope, () => {
			log.captureException(
				{
					code: "invalid_input",
					level: "info",
					report: false,
					internalMessage: "x",
				},
				"op",
			);
			log.captureException(
				{
					code: "internal",
					level: "error",
					report: true,
					internalMessage: "boom 010-1234-5678",
				},
				"op",
			);
		});
		expect(scope.captured).toHaveLength(1);
		expect(scope.captured[0]?.properties).toMatchObject({
			code: "internal",
			operation: "op",
			$exception_list: [{ value: "boom [phone]" }],
		});
	});

	it("범위 밖에서는 보고하지 않는다 (테스트/모듈 초기화)", () => {
		const log = createLogger(CATALOG);
		expect(() => {
			log.captureException(
				{
					code: "internal",
					level: "error",
					report: true,
					internalMessage: "x",
				},
				"op",
			);
		}).not.toThrow();
	});
});

describe(flushToPostHog, () => {
	it("모인 이벤트를 batch 한 번으로 보내고 버퍼를 비운다", async () => {
		const scope = createScope("req-3", "anon-1");
		scope.captured.push({
			event: "order_placed",
			properties: { orderId: "o1" },
			timestamp: "2026-11-04T00:00:00.000Z",
		});
		const fake = recordingFetch([new Response("{}", { status: 200 })]);
		await expect(
			flushToPostHog(scope, CONFIG, fake.impl),
		).resolves.toStrictEqual({ sent: 1 });
		expect(scope.captured).toHaveLength(0);
		expect(fake.calls[0]?.url).toBe("https://ph.example/batch/");
		expect(jsonBody(fake.calls[0])).toMatchObject({
			api_key: KEY,
			batch: [
				{
					event: "order_placed",
					distinct_id: "anon-1",
					properties: { orderId: "o1", request_id: "req-3" },
				},
			],
		});
	});

	it("설정이 없거나 보낼 것이 없으면 요청하지 않는다", async () => {
		const fake = recordingFetch([]);
		const scope = createScope("req-4");
		await expect(
			flushToPostHog(scope, CONFIG, fake.impl),
		).resolves.toStrictEqual({ sent: 0 });
		scope.captured.push({ event: "x", properties: {}, timestamp: "" });
		await expect(flushToPostHog(scope, null, fake.impl)).resolves.toStrictEqual(
			{
				sent: 0,
			},
		);
		expect(fake.calls).toHaveLength(0);
	});

	it("전송 실패는 예외 대신 결과로 돌려준다 (관측이 서비스를 막지 않게)", async () => {
		const scope = createScope("req-5");
		scope.captured.push({ event: "x", properties: {}, timestamp: "" });
		const fake = recordingFetch([new Response("no", { status: 500 })]);
		await expect(
			flushToPostHog(scope, CONFIG, fake.impl),
		).resolves.toStrictEqual({ sent: 0, status: 500 });
	});
});

describe(observeTask, () => {
	it("작업이 실패해도 범위를 정리하고 전송을 waitUntil에 맡긴다", async () => {
		const pending: Promise<unknown>[] = [];
		const ctx = {
			waitUntil: (promise: Promise<unknown>) => pending.push(promise),
		};
		await expect(
			observeTask("cron:test", ctx, () => Promise.reject(new Error("x")), {
				posthog: () => null,
			}),
		).rejects.toThrow("x");
		expect(pending).toHaveLength(1);
	});
});
