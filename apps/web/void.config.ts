import { defineConfig } from "void/config";

import { QUEUES } from "./src/platform/server/queue-config";

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
		// queues/sms.ts의 자동 생성 이름도 jwc-form-sms로 맞춘다 (ADR-0019).
		name: "jwc-form",
		main: "./server.ts",
		// 대시보드에서 연결한 운영 도메인. 코드에 없으면 void deploy가 기존 라우트를 덮을 수 없어 멈춘다 (ADR-0020).
		routes: [{ pattern: "veloss-todo.uk", custom_domain: true }],
		// 공개 설정도 코드로 고정한다: 값이 없으면 void가 대시보드 상태를 덮지 못해 배포를 멈춘다.
		// 운영은 Custom Domain으로만 받는다. 미리보기 URL은 void의 배포 전 준비 확인이 쓰므로 켠다 (ADR-0020).
		workers_dev: false,
		preview_urls: true,
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
