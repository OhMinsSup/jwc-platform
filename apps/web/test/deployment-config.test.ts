import { existsSync } from "node:fs";

import { describe, expect, it } from "vite-plus/test";

import { QUEUES } from "../src/platform/server/queue-config";
import config from "../void.config";

describe("Cloudflare 배포 대상과 큐 이름 계약", () => {
	it("Secret 등록과 배포가 명시한 같은 Worker를 사용한다", () => {
		expect(config.cloudflare?.name).toBe("jwc-form");
		expect(config.cloudflare?.main).toBe("./server.ts");
	});

	it("사용자가 연결한 운영 Custom Domain을 배포 설정에 유지한다", () => {
		expect(config.cloudflare?.routes).toStrictEqual([
			{ pattern: "veloss-todo.uk", custom_domain: true },
		]);
	});

	it("운영 주소는 Custom Domain만 열고, 배포 준비 확인용 미리보기 URL은 켠다", () => {
		expect(config.cloudflare?.workers_dev).toBe(false);
		expect(config.cloudflare?.preview_urls).toBe(true);
	});

	it("발견된 SMS 큐의 자동 생성 이름이 생산자와 소비자에 일치한다", () => {
		expect(existsSync(new URL("../queues/sms.ts", import.meta.url))).toBe(true);
		const queue = `${config.cloudflare?.name ?? ""}-sms`;
		expect(queue).toBe(QUEUES.sms.name);
		expect(config.cloudflare?.queues?.producers).toStrictEqual([
			{ binding: QUEUES.sms.binding, queue },
		]);
		expect(config.cloudflare?.queues?.consumers).toStrictEqual([
			{
				queue,
				max_batch_size: QUEUES.sms.maxBatchSize,
				max_retries: QUEUES.sms.maxRetries,
				retry_delay: QUEUES.sms.retryDelay,
			},
		]);
	});
});
