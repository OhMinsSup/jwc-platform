import { hmacWithSecret } from "./crypto";
import { timingSafeEqual } from "./encoding";

/** 웹훅 서명 허용 시간차 (재전송 공격 방지) */
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

/** 서명 = hex(HMAC-SHA256(secret, `${timestamp}.${rawBody}`)), timestamp는 epoch ms */
export async function verifyWebhookSignature(
	secret: string,
	headers: { timestamp: string | null; signature: string | null },
	rawBody: string,
	now: number,
): Promise<boolean> {
	const timestamp = Number(headers.timestamp);
	if (
		!(headers.signature && Number.isFinite(timestamp)) ||
		Math.abs(now - timestamp) > MAX_CLOCK_SKEW_MS
	) {
		return false;
	}
	const expected = await hmacWithSecret(
		secret,
		`${headers.timestamp}.${rawBody}`,
	);
	return timingSafeEqual(expected, headers.signature.toLowerCase());
}
