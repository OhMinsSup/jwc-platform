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
		const response = await runInScope(scope, () => inner(request, env, ctx));
		ctx.waitUntil(flush(scope, options));
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
	const scope = createScope(`${label}:${crypto.randomUUID()}`);
	try {
		return await runInScope(scope, run);
	} finally {
		ctx.waitUntil(flush(scope, options));
	}
}
