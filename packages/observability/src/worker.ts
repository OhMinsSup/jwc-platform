import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
	BatchLogRecordProcessor,
	LoggerProvider,
} from "@opentelemetry/sdk-logs";

import { distinctIdFromCookie, flushToPostHog } from "./posthog";
import type { FlushResult, PostHogConfig } from "./posthog";
import { createScope, runInScope } from "./scope";
import type { TelemetryScope } from "./scope";

/**
 * 워커 진입점(fetch/queue/scheduled)을 관측 범위로 감싼다.
 * 범위 안의 모든 로그에 requestId가 붙고, 모인 PostHog 이벤트는 응답 뒤 waitUntil로 보낸다.
 */

/** 응답 뒤 작업을 맡길 수 있는 실행 컨텍스트 (Workers ExecutionContext의 필요한 부분) */
export interface WaitUntilContext {
	waitUntil: (promise: Promise<unknown>) => void;
}

export type WorkerFetch<Env, Ctx extends WaitUntilContext> = (
	request: Request,
	env: Env,
	ctx: Ctx,
) => Promise<Response>;

export interface ObserveOptions {
	/** 전송 실패 보고 (범위 밖에서 호출된다: 실패 로그가 다시 버퍼에 쌓이지 않게) */
	onFlushFailed?: (result: FlushResult) => void;
	/** 요청마다 읽는 PostHog 설정 (없으면 보내지 않는다) */
	posthog: () => PostHogConfig | null;
}

export const REQUEST_ID_HEADER = "x-request-id";

/** Cloudflare가 붙이는 cf-ray가 있으면 그것을 쓴다 (대시보드 로그와 바로 대조 가능) */
function requestIdOf(request: Request): string {
	return request.headers.get("cf-ray") ?? crypto.randomUUID();
}

async function flush(
	scope: TelemetryScope,
	options: ObserveOptions,
): Promise<void> {
	const result = await flushToPostHog(scope, options.posthog());
	if (result.status !== undefined || result.error !== undefined) {
		options.onFlushFailed?.(result);
	}
}

/**
 * PostHog Logs exporter. It has its own provider instead of registering globally,
 * so the app's existing console/catalog loggers never leave this process through OTLP.
 */
interface PostHogLogs {
	configKey: string;
	logger: ReturnType<LoggerProvider["getLogger"]>;
	provider: LoggerProvider;
}

let posthogLogs: PostHogLogs | null = null;

function logsFor(config: PostHogConfig): PostHogLogs {
	const configKey = `${config.host}:${config.apiKey}`;
	if (posthogLogs?.configKey === configKey) {
		return posthogLogs;
	}
	// OpenTelemetry 3.x: Resource 클래스 대신 resourceFromAttributes, 프로세서는 생성자에서 등록하고
	// 프로세서는 exporter를 옵션 객체로 받는다
	const provider = new LoggerProvider({
		resource: resourceFromAttributes({ "service.name": "jwc-form-worker" }),
		processors: [
			new BatchLogRecordProcessor({
				exporter: new OTLPLogExporter({
					url: `${config.host}/i/v1/logs`,
					headers: { Authorization: `Bearer ${config.apiKey}` },
				}),
			}),
		],
	});
	posthogLogs = {
		configKey,
		logger: provider.getLogger("jwc-form-posthog-log-exporter"),
		provider,
	};
	return posthogLogs;
}

function emitPostHogLog(config: PostHogConfig | null, body: string): void {
	if (!config) {
		return;
	}
	logsFor(config).logger.emit({ severityText: "INFO", body });
}

async function flushPostHogLogs(config: PostHogConfig): Promise<void> {
	try {
		await logsFor(config).provider.forceFlush();
	} catch {
		// Logging delivery must not change the request or task outcome.
	}
}

/** 요청 1개 = 범위 1개. 응답에 x-request-id를 붙여 사용자 문의와 로그를 연결할 수 있게 한다 */
export function observeFetch<Env, Ctx extends WaitUntilContext>(
	inner: WorkerFetch<Env, Ctx>,
	options: ObserveOptions,
): WorkerFetch<Env, Ctx> {
	return async (request, env, ctx) => {
		const config = options.posthog();
		const scope = createScope(
			requestIdOf(request),
			config
				? distinctIdFromCookie(request.headers.get("cookie"), config.apiKey)
				: null,
		);
		emitPostHogLog(config, "worker.fetch_received");
		const response = await runInScope(scope, () => inner(request, env, ctx));
		emitPostHogLog(config, "worker.fetch_responded");
		ctx.waitUntil(flush(scope, options));
		if (config) {
			ctx.waitUntil(flushPostHogLogs(config));
		}
		const headers = new Headers(response.headers);
		headers.set(REQUEST_ID_HEADER, scope.requestId);
		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers,
		});
	};
}

/** 큐 배치/크론 실행 1회 = 범위 1개 */
export async function observeTask<T>(
	label: string,
	ctx: WaitUntilContext,
	run: () => Promise<T>,
	options: ObserveOptions,
): Promise<T> {
	const config = options.posthog();
	const scope = createScope(`${label}:${crypto.randomUUID()}`);
	emitPostHogLog(config, "worker.task_started");
	try {
		return await runInScope(scope, run);
	} finally {
		ctx.waitUntil(flush(scope, options));
		if (config) {
			ctx.waitUntil(flushPostHogLogs(config));
		}
	}
}
