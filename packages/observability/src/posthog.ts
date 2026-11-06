import type { CapturedEvent, TelemetryScope } from "./scope";

/**
 * PostHog 서버 전송 (HTTP batch API). Workers에서 Node SDK 대신 fetch로 보낸다.
 * 설정이 없으면(키 없음) 아무것도 보내지 않는다.
 */

export interface PostHogConfig {
	apiKey: string;
	/** 예: https://us.i.posthog.com (끝 슬래시 없음) */
	host: string;
}

/** 브라우저 PostHog가 남긴 쿠키(ph_<key>_posthog)의 익명 distinct_id */
export function distinctIdFromCookie(
	cookieHeader: string | null,
	apiKey: string,
): string | null {
	if (!cookieHeader) {
		return null;
	}
	const name = `ph_${apiKey}_posthog=`;
	const raw = cookieHeader
		.split(";")
		.map((part) => part.trim())
		.find((part) => part.startsWith(name))
		?.slice(name.length);
	if (!raw) {
		return null;
	}
	try {
		const parsed: unknown = JSON.parse(decodeURIComponent(raw));
		if (
			typeof parsed === "object" &&
			parsed !== null &&
			"distinct_id" in parsed &&
			typeof parsed.distinct_id === "string"
		) {
			return parsed.distinct_id;
		}
	} catch {
		// 형식이 다른 쿠키는 무시한다 (분석 ID가 없을 뿐 요청은 정상 처리)
	}
	return null;
}

/** 익명 사용자 없이 서버에서만 생긴 이벤트(크론, 큐)의 distinct_id */
const SERVER_DISTINCT_ID = "jwc-form-server";

function toBatchItem(scope: TelemetryScope, event: CapturedEvent) {
	return {
		event: event.event,
		distinct_id: scope.distinctId ?? SERVER_DISTINCT_ID,
		timestamp: event.timestamp,
		properties: {
			...event.properties,
			request_id: scope.requestId,
			// 서버 이벤트로 사람 프로필을 만들지 않는다
			$process_person_profile: scope.distinctId !== null,
		},
	};
}

export interface FlushResult {
	error?: string;
	sent: number;
	status?: number;
}

/** 범위에 모인 이벤트를 한 번에 보낸다. 실패해도 예외를 던지지 않는다(관측이 서비스를 막지 않게) */
export async function flushToPostHog(
	scope: TelemetryScope,
	config: PostHogConfig | null,
	fetchImpl: typeof fetch = fetch,
): Promise<FlushResult> {
	const events = scope.captured.splice(0);
	if (!config || events.length === 0) {
		return { sent: 0 };
	}
	try {
		const response = await fetchImpl(`${config.host}/batch/`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				api_key: config.apiKey,
				batch: events.map((event) => toBatchItem(scope, event)),
			}),
		});
		return response.ok
			? { sent: events.length }
			: { sent: 0, status: response.status };
	} catch (error) {
		return {
			sent: 0,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}
