import { defineConfig } from "void/config";

import { QUEUES } from "./src/server/queue-config";

const queues = Object.values(QUEUES);

/**
 * void 1.5 프레임워크(TanStack Start) 모드의 운영 빌드는 fetch 핸들러만 내보내고
 * queues/ 를 wrangler 설정에 반영하지 않는다(빌드 산출물로 확인함).
 * 그래서 워커 엔트리(server.ts)와 큐 바인딩을 명시적으로 선언한다. cron 트리거는 crons/ 에서 추론된다. (ADR-0002 참고)
 */
export default defineConfig({
	inference: { appType: "framework" },
	worker: {
		compatibility_flags: ["nodejs_compat"],
	},
	cloudflare: {
		main: "./server.ts",
		queues: {
			producers: queues.map((queue) => ({
				queue: queue.name,
				binding: queue.binding,
			})),
			consumers: queues.map((queue) => ({
				queue: queue.name,
				max_batch_size: queue.maxBatchSize,
				max_retries: queue.maxRetries,
				retry_delay: queue.retryDelay,
			})),
		},
	},
});
