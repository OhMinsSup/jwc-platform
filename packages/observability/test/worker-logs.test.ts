import { once } from "node:events";
import { createServer } from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";

import { afterEach, describe, expect, it } from "vite-plus/test";

import { observeTask } from "../src/worker";

/**
 * PostHog Logs(OTLP/HTTP) 전송 경로. 가짜 fetch가 아니라 실제 HTTP 서버로 받아서,
 * OpenTelemetry SDK의 생성 방식(Resource, 프로세서 등록)과 전송 계층이 바뀌어도 로그가 나가는지 본다.
 * (Node에서는 http 전송, Workers 빌드에서는 fetch 전송이 쓰인다)
 */

interface Received {
	method: string | undefined;
	path: string | undefined;
	authorization: string | undefined;
	body: string;
}

const API_KEY = "phc_test_only_key";

async function readBody(request: IncomingMessage): Promise<string> {
	const chunks: Uint8Array[] = [];
	for await (const chunk of request) {
		if (chunk instanceof Uint8Array) {
			chunks.push(chunk);
		}
	}
	return Buffer.concat(chunks).toString("utf-8");
}

async function respond(
	request: IncomingMessage,
	response: ServerResponse,
	received: Received[],
): Promise<void> {
	received.push({
		method: request.method,
		path: request.url,
		authorization: request.headers.authorization,
		body: await readBody(request),
	});
	response.writeHead(200, { "content-type": "application/json" });
	response.end("{}");
}

async function startCollector(): Promise<{
	server: Server;
	host: string;
	received: Received[];
}> {
	const received: Received[] = [];
	const server = createServer((request, response) => {
		respond(request, response, received).catch(() => response.destroy());
	});
	server.listen(0, "127.0.0.1");
	await once(server, "listening");
	const address = server.address();
	if (address === null || typeof address === "string") {
		throw new Error("수집 서버 주소를 알 수 없습니다");
	}
	return { server, host: `http://127.0.0.1:${address.port}`, received };
}

describe("PostHog Logs 전송", () => {
	let collector: Awaited<ReturnType<typeof startCollector>> | null = null;

	afterEach(async () => {
		const current = collector;
		collector = null;
		if (current) {
			current.server.close();
			await once(current.server, "close");
		}
	});

	it("작업 시작 로그를 OTLP로 /i/v1/logs에 Bearer 키와 함께 보낸다", async () => {
		collector = await startCollector();
		const config = { apiKey: API_KEY, host: collector.host };
		const pending: Promise<unknown>[] = [];
		await observeTask(
			"cron:logs-test",
			{ waitUntil: (promise) => pending.push(promise) },
			() => Promise.resolve("done"),
			{ posthog: () => config },
		);
		await Promise.all(pending);
		const logs = collector.received.filter(
			(request) => request.path === "/i/v1/logs",
		);
		expect(logs).toHaveLength(1);
		expect(logs[0]?.method).toBe("POST");
		expect(logs[0]?.authorization).toBe(`Bearer ${API_KEY}`);
		expect(logs[0]?.body).toContain("worker.task_started");
		expect(logs[0]?.body).toContain("jwc-form-worker");
	});
});
