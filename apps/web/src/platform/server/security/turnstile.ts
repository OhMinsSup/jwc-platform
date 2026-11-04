import { verifyTurnstile } from "@jwc/security/turnstile";
import type { TurnstileOutcome } from "@jwc/security/turnstile";

import type { ErrorCode } from "../errors/catalog";
import { DomainError } from "../errors/domain-error";
import type { TurnstileConfig } from "../runtime";

/** 검증 결과 → 사용자 문장/오류 코드 (통과 외에는 모두 막는다) */
const FAILURES: Record<
	Exclude<TurnstileOutcome, "passed">,
	{ code: ErrorCode; message: string }
> = {
	missing: {
		code: "bot_check_failed",
		message: "자동 입력 방지 확인이 필요합니다",
	},
	rejected: {
		code: "bot_check_failed",
		message: "자동 입력 방지 확인에 실패했습니다. 다시 시도해주세요",
	},
	unavailable: {
		code: "upstream_unavailable",
		message: "자동 입력 방지 확인 서버가 응답하지 않습니다",
	},
};

/** Turnstile 설정이 없으면(null) 검사하지 않는다 */
export async function assertHuman(
	config: TurnstileConfig | null,
	token: string | undefined,
	remoteIp: string,
	fetchImpl: typeof fetch = fetch,
): Promise<void> {
	if (!config) {
		return;
	}
	const outcome = await verifyTurnstile(
		config.secretKey,
		token,
		remoteIp,
		fetchImpl,
	);
	if (outcome !== "passed") {
		const failure = FAILURES[outcome];
		throw new DomainError(failure.message, { code: failure.code });
	}
}
