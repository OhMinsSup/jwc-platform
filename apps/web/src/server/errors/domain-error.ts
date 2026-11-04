/**
 * 도메인 오류. message는 사용자에게 그대로 보여도 되는 문장만 담는다.
 * (내부 상세는 log로만 남긴다)
 */
export interface DomainErrorOptions extends ErrorOptions {
	/** 클라이언트에 돌려줄 HTTP 상태 */
	status: number;
}

/** 표준 Error와 같은 (message, options) 형태. 원인 오류는 options.cause로 넘긴다 */
export class DomainError extends Error {
	override name = "DomainError";
	readonly status: number;
	constructor(message: string, { status, ...options }: DomainErrorOptions) {
		super(message, options);
		this.status = status;
	}
}
