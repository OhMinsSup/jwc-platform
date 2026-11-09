import { z } from "zod";

/**
 * Cloudflare Turnstile 토큰 서버 검증. 결과를 데이터로 돌려주고, 사용자 문장/오류 분류는 앱이 정한다.
 */

const SITEVERIFY_URL =
	"https://challenges.cloudflare.com/turnstile/v0/siteverify";

const SiteverifyResponseSchema = z.object({ success: z.boolean() });

/** passed: 통과 / missing: 토큰 없음 / rejected: 검증 실패 / unavailable: 검증 서버 장애(통과시키지 않는다) */
export type TurnstileOutcome =
	| "passed"
	| "missing"
	| "rejected"
	| "unavailable";

export async function verifyTurnstile(
	secretKey: string,
	token: string | undefined,
	remoteIp: string,
	fetchImpl: typeof fetch = fetch,
): Promise<TurnstileOutcome> {
	if (!token) {
		return "missing";
	}
	const response = await fetchImpl(SITEVERIFY_URL, {
		method: "POST",
		body: new URLSearchParams({
			secret: secretKey,
			response: token,
			remoteip: remoteIp,
		}),
	});
	if (!response.ok) {
		return "unavailable";
	}
	const parsed = SiteverifyResponseSchema.safeParse(await response.json());
	return parsed.success && parsed.data.success ? "passed" : "rejected";
}
