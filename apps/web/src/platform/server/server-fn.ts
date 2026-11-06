import { classifyError } from "./errors/classify";
import { captureException, log } from "./log";

/**
 * 서버 함수 결과 계약. 예상 가능한 실패는 throw 대신 값으로 돌려준다
 * (클라이언트가 필드 오류를 그대로 표시할 수 있도록). 실패 분류는 오류 카탈로그를 따른다.
 */
export type Result<T> =
	| { ok: true; data: T }
	| {
			ok: false;
			/** 오류 카탈로그 코드 (클라이언트 분기/분석용) */
			code: string;
			message: string;
			fieldErrors?: Record<string, string>;
	  };

export async function toResult<T>(
	operation: string,
	run: () => Promise<T>,
): Promise<Result<T>> {
	try {
		return { ok: true, data: await run() };
	} catch (error) {
		const failure = classifyError(error);
		log[failure.spec.level]("server_fn.failed", {
			operation,
			code: failure.code,
			error: failure.internalMessage,
		});
		captureException(failure, operation);
		return {
			ok: false,
			code: failure.code,
			message: failure.userMessage,
			...(failure.fieldErrors ? { fieldErrors: failure.fieldErrors } : {}),
		};
	}
}
