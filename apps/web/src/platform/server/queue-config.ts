/**
 * 큐/크론 설정의 단일 소스. void.config.ts(배포 설정)와 소비자 코드가 함께 읽는다.
 * 런타임 의존성이 없는 상수만 둔다 (void.config.ts가 빌드 도구에서 로드되므로).
 */
export const QUEUES = {
	sms: {
		name: "jwc-form-sms",
		binding: "QUEUE_SMS",
		maxBatchSize: 5,
		maxRetries: 5,
		retryDelay: 60,
	},
} as const;
