import { DomainError, InvalidInputError } from "../server/errors";
import { errorMessage, log } from "../server/log";

/**
 * 서버 함수 결과 계약. 예상 가능한 실패는 throw 대신 값으로 돌려준다
 * (클라이언트가 필드 오류를 그대로 표시할 수 있도록).
 */
export type Result<T> =
	| { ok: true; data: T }
	| { ok: false; message: string; fieldErrors?: Record<string, string> };

const GENERIC_FAILURE =
	"일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";

export async function toResult<T>(
	operation: string,
	run: () => Promise<T>,
): Promise<Result<T>> {
	try {
		return { ok: true, data: await run() };
	} catch (error) {
		if (error instanceof InvalidInputError) {
			return {
				ok: false,
				message: error.message,
				fieldErrors: error.fieldErrors,
			};
		}
		if (error instanceof DomainError) {
			return { ok: false, message: error.message };
		}
		log.error("server_fn.failed", { operation, error: errorMessage(error) });
		return { ok: false, message: GENERIC_FAILURE };
	}
}
