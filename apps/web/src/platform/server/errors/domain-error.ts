import { ERROR_CATALOG } from "./catalog";
import type { ErrorCode } from "./catalog";

/**
 * 도메인 오류. message는 사용자에게 그대로 보여도 되는 문장만 담는다 (내부 상세는 log로만 남긴다).
 * 상태 코드/재시도/로그 레벨은 code로 오류 카탈로그에서 정해진다.
 */
export interface DomainErrorOptions extends ErrorOptions {
	code: ErrorCode;
}

/** 표준 Error와 같은 (message, options) 형태. 원인 오류는 options.cause로 넘긴다 */
export class DomainError extends Error {
	override name = "DomainError";
	readonly code: ErrorCode;
	constructor(message: string, { code, ...options }: DomainErrorOptions) {
		super(message, options);
		this.code = code;
	}
	/** 클라이언트에 돌려줄 HTTP 상태 */
	get status(): number {
		return ERROR_CATALOG[this.code].status;
	}
}
