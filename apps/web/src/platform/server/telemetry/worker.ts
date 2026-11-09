import {
	observeFetch as observeFetchWith,
	observeTask as observeTaskWith,
} from "@jwc/observability/worker";
import type {
	ObserveOptions,
	WorkerFetch as GenericWorkerFetch,
} from "@jwc/observability/worker";
import type { CloudEnv } from "void";

import { log } from "../log";
import { posthogConfig } from "../runtime";

/** 앱 워커 시그니처 (void 바인딩 + Workers 실행 컨텍스트) */
export type WorkerFetch = GenericWorkerFetch<
	CloudEnv["Bindings"],
	ExecutionContext
>;

const OPTIONS: ObserveOptions = {
	posthog: posthogConfig,
	onFlushFailed: (result) => {
		log.warn("telemetry.flush_failed", {
			status: result.status ?? null,
			error: result.error ?? null,
		});
	},
};

/** 요청 1개 = 관측 범위 1개 (requestId, 응답 뒤 PostHog 전송) */
export function observeFetch(inner: WorkerFetch): WorkerFetch {
	return observeFetchWith(inner, OPTIONS);
}

/** 큐 배치/크론 실행 1회 = 관측 범위 1개 */
export function observeTask<T>(
	label: string,
	ctx: ExecutionContext,
	run: () => Promise<T>,
): Promise<T> {
	return observeTaskWith(label, ctx, run, OPTIONS);
}
