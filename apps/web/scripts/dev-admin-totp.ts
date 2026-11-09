import { createHmac } from "node:crypto";

/**
 * 로컬 개발 관리자의 TOTP (RFC 6238, Better Auth와 같은 SHA-1·30초·6자리).
 * 비밀값은 저장하지 않고 BETTER_AUTH_SECRET + 이메일에서 매번 같은 값으로 파생한다.
 * 그래서 seed와 코드 출력 명령이 파일·DB 읽기 없이 같은 키를 쓴다.
 */

const DERIVATION_LABEL = "jwc-dev-admin-totp";
const SECRET_LENGTH = 32;
const PERIOD_SECONDS = 30;
const SECOND_MS = 1000;
const CODE_MODULUS = 1_000_000;
const CODE_DIGITS = 6;
const COUNTER_BYTES = 8;
/** RFC 4226 동적 절단: 마지막 바이트의 하위 4비트 = 오프셋, 31비트 양수로 자른다 */
const OFFSET_RANGE = 16;
const POSITIVE_RANGE = 2 ** 31;

/** Better Auth는 이 문자열의 UTF-8 바이트를 HMAC 키로 쓴다 (설정 키 = base32(이 바이트)) */
export function deriveDevTotpSecret(authSecret: string, email: string): string {
	return createHmac("sha256", authSecret)
		.update(`${DERIVATION_LABEL}\0${email}`)
		.digest("hex")
		.slice(0, SECRET_LENGTH);
}

export function totpCode(secret: string, nowMs: number): string {
	const counter = new Uint8Array(COUNTER_BYTES);
	new DataView(counter.buffer).setBigUint64(
		0,
		BigInt(Math.floor(nowMs / SECOND_MS / PERIOD_SECONDS)),
	);
	const digest = createHmac("sha1", secret).update(counter).digest();
	const offset = (digest.at(-1) ?? 0) % OFFSET_RANGE;
	const value = (digest.readUInt32BE(offset) % POSITIVE_RANGE) % CODE_MODULUS;
	return value.toString().padStart(CODE_DIGITS, "0");
}

/** 현재 코드가 바뀌기까지 남은 초 */
export function secondsUntilNextCode(nowMs: number): number {
	return PERIOD_SECONDS - (Math.floor(nowMs / SECOND_MS) % PERIOD_SECONDS);
}
