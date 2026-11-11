import { RateLimitExceededError } from "@jwc/security/rate-limit";
import { SubmissionStoreError } from "@jwc/submission-store";
import type { StoreFailure } from "@jwc/submission-store";
import { z } from "zod";

import { SmsSendError } from "../solapi";
import { ERROR_CATALOG } from "./catalog";
import type { ErrorCode, ErrorSpec } from "./catalog";
import { causeChain } from "./cause-chain";
import { DomainError } from "./domain-error";
import { InvalidInputError } from "./invalid-input-error";

/**
 * 어떤 오류든 카탈로그 항목 하나로 분류한다. 서버 함수 응답, 로그, 큐 재시도, 오류 추적이 모두 이 결과를 쓴다.
 * 분류 규칙은 위에서부터 첫 번째로 맞는 것 (데이터 표 + 단일 함수).
 */

export interface ClassifiedError {
	code: ErrorCode;
	/** 사용자에게 보여도 되는 필드 오류 (입력 오류일 때만) */
	fieldErrors?: Record<string, string>;
	/** 로그/오류 추적용 내부 문장 (사용자에게 보내지 않는다) */
	internalMessage: string;
	spec: ErrorSpec;
	/** 사용자에게 보여 줄 문장 */
	userMessage: string;
}

const STORE_FAILURE_CODE: Record<StoreFailure, ErrorCode> = {
	unavailable: "store_unavailable",
	forbidden: "store_misconfigured",
	layout: "store_misconfigured",
	not_found: "not_found",
};

function codeOf(error: unknown): ErrorCode {
	if (error instanceof DomainError) {
		return error.code;
	}
	if (error instanceof SubmissionStoreError) {
		return STORE_FAILURE_CODE[error.failure];
	}
	if (error instanceof RateLimitExceededError) {
		return "rate_limited";
	}
	if (error instanceof SmsSendError) {
		return error.retryable ? "upstream_unavailable" : "upstream_rejected";
	}
	if (error instanceof z.ZodError) {
		return "invalid_payload";
	}
	return "internal";
}

function describe(error: unknown): string {
	return error instanceof Error
		? `${error.name}: ${error.message}`
		: String(error);
}

/** 로그용 내부 문장: 원인 사슬까지 남긴다 (사용자에게는 보내지 않는다) */
function internalMessageOf(error: unknown): string {
	return causeChain(error).map(describe).join(" ← cause: ");
}

export function classifyError(error: unknown): ClassifiedError {
	const code = codeOf(error);
	const spec = ERROR_CATALOG[code];
	// 도메인 오류의 message만 사용자 문장이다. 그 밖의 오류 문장은 내부 상세라 노출하지 않는다
	const userMessage =
		error instanceof DomainError ? error.message : spec.defaultMessage;
	return {
		code,
		spec,
		userMessage,
		internalMessage: internalMessageOf(error),
		...(error instanceof InvalidInputError
			? { fieldErrors: error.fieldErrors }
			: {}),
	};
}
