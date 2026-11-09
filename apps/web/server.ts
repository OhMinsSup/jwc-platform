import handler from "@tanstack/react-start/server-entry";

import { secureFetch } from "./src/platform/server/security/worker";
import { observeFetch } from "./src/platform/server/telemetry/worker";
import type { WorkerFetch } from "./src/platform/server/telemetry/worker";
import {
	dispatchQueue,
	dispatchScheduled,
} from "./src/platform/server/worker-triggers";

/**
 * Workers는 fetch(request, env, ctx)로 부른다. TanStack Start 핸들러 타입은 (request, opts?)이지만
 * 기존 엔트리(`...handler`)와 같은 인자를 그대로 넘긴다.
 */
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- 위 설명: 런타임 호출 형태를 바꾸지 않으려고 Workers 시그니처로 본다
const startFetch = handler.fetch as unknown as WorkerFetch;

/**
 * Cloudflare Worker 엔트리.
 * fetch는 TanStack Start, scheduled/queue는 crons/·queues/ 핸들러로 분배한다. 모두 관측 범위(telemetry/worker.ts)로 감싼다.
 */
export default {
	// 바깥부터: 관측 범위(requestId) → 보안 판정/헤더 → TanStack Start
	fetch: observeFetch(secureFetch(startFetch)),
	scheduled: dispatchScheduled,
	queue: dispatchQueue,
};
