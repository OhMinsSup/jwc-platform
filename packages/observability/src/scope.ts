import { AsyncLocalStorage } from "node:async_hooks";

/**
 * 요청(또는 큐 배치/크론 실행) 단위 관측 범위.
 * - requestId: 로그 상관관계 ID (Cloudflare cf-ray가 있으면 그 값, 없으면 생성). 큐 메시지에는 traceId로 실어 보낸다.
 * - distinctId: PostHog 사용자 ID (브라우저 PostHog 쿠키의 익명 ID, 관리자는 사용자 id). 없으면 null.
 * - captured: 응답 뒤에 한 번에 보낼 PostHog 이벤트 버퍼 (요청 지연을 늘리지 않는다).
 */

export interface CapturedEvent {
	event: string;
	properties: Record<string, unknown>;
	timestamp: string;
}

export interface TelemetryScope {
	captured: CapturedEvent[];
	distinctId: string | null;
	requestId: string;
}

const storage = new AsyncLocalStorage<TelemetryScope>();

export function createScope(
	requestId: string,
	distinctId: string | null = null,
): TelemetryScope {
	return { requestId, distinctId, captured: [] };
}

export function runInScope<T>(scope: TelemetryScope, run: () => T): T {
	return storage.run(scope, run);
}

/** 범위 밖(테스트, 모듈 초기화)이면 undefined */
export function currentScope(): TelemetryScope | undefined {
	return storage.getStore();
}

/** 현재 요청 ID (큐 메시지 traceId로 전파) */
export function currentRequestId(): string | undefined {
	return storage.getStore()?.requestId;
}
