/**
 * 오류 카탈로그: 오류 코드 → 처리 방식(데이터). 응답 상태, 사용자 문구, 재시도, 로그 레벨, 오류 추적 보고 여부를
 * 한 표에서 정한다. 새 실패 유형은 여기 한 줄을 추가하고 classifyError(classify.ts)에서 매핑한다.
 */

import type { LogLevel } from "@jwc/observability";

export interface ErrorSpec {
	/** 메시지를 따로 주지 않았을 때 사용자에게 보여 줄 문장 (내부 상세를 담지 않는다) */
	defaultMessage: string;
	level: LogLevel;
	/** 오류 추적(PostHog)에 예외로 보고할지. 사용자 입력 오류처럼 정상 흐름인 것은 보고하지 않는다 */
	report: boolean;
	/** 같은 요청/메시지를 다시 시도하면 성공할 수 있는지 (큐 재시도 판단) */
	retryable: boolean;
	/** HTTP 상태 */
	status: number;
}

const GENERIC_MESSAGE =
	"일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";

export const ERROR_CATALOG = {
	invalid_input: {
		status: 422,
		defaultMessage: "입력값을 확인해주세요",
		retryable: false,
		level: "info",
		report: false,
	},
	not_found: {
		status: 404,
		defaultMessage: "요청한 항목을 찾을 수 없습니다",
		retryable: false,
		level: "info",
		report: false,
	},
	form_closed: {
		status: 409,
		defaultMessage: "접수가 마감된 폼입니다",
		retryable: false,
		level: "info",
		report: false,
	},
	conflict: {
		status: 409,
		defaultMessage: "다른 작업과 충돌했습니다. 다시 시도해주세요",
		retryable: true,
		level: "warn",
		report: false,
	},
	unauthorized: {
		status: 401,
		defaultMessage: "관리자 로그인이 필요합니다",
		retryable: false,
		level: "info",
		report: false,
	},
	forbidden: {
		status: 403,
		defaultMessage: "권한이 없습니다",
		retryable: false,
		level: "warn",
		report: false,
	},
	rate_limited: {
		status: 429,
		defaultMessage: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요",
		retryable: true,
		level: "warn",
		report: false,
	},
	/** 자동 입력 방지(Turnstile) 확인 실패 */
	bot_check_failed: {
		status: 403,
		defaultMessage: "자동 입력 방지 확인에 실패했습니다. 다시 시도해주세요",
		retryable: false,
		level: "info",
		report: false,
	},
	/** 응답 저장소 일시 장애/할당량 */
	store_unavailable: {
		status: 503,
		defaultMessage: GENERIC_MESSAGE,
		retryable: true,
		level: "error",
		report: true,
	},
	/** 응답 저장소 권한/구조 문제 (운영자 조치 필요) */
	store_misconfigured: {
		status: 502,
		defaultMessage: GENERIC_MESSAGE,
		retryable: false,
		level: "error",
		report: true,
	},
	/** 외부 서비스(문자 등) 일시 장애 */
	upstream_unavailable: {
		status: 502,
		defaultMessage: GENERIC_MESSAGE,
		retryable: true,
		level: "error",
		report: true,
	},
	/** 외부 서비스가 요청을 거절 (재시도해도 같은 결과) */
	upstream_rejected: {
		status: 502,
		defaultMessage: GENERIC_MESSAGE,
		retryable: false,
		level: "error",
		report: true,
	},
	/** 큐 메시지/저장 데이터가 계약과 다름 */
	invalid_payload: {
		status: 500,
		defaultMessage: GENERIC_MESSAGE,
		retryable: false,
		level: "error",
		report: true,
	},
	/** 분류되지 않은 오류 = 코드 버그 또는 예상하지 못한 장애 */
	internal: {
		status: 500,
		defaultMessage: GENERIC_MESSAGE,
		retryable: true,
		level: "error",
		report: true,
	},
} as const satisfies Record<string, ErrorSpec>;

export type ErrorCode = keyof typeof ERROR_CATALOG;
