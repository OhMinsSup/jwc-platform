import { hmacHex } from "@jwc/common/crypto";
import { bytesToBase64Url } from "@jwc/common/encoding";

/**
 * 관리자 초대 코드. 원문은 만들 때 한 번만 보여 주고, 저장은 키 기반 해시만 한다.
 * 18바이트(144비트) 난수 → base64url 24자 (패딩 없음, URL/메신저에 그대로 붙여 넣을 수 있다).
 */

const INVITE_CODE_BYTES = 18;
const INVITE_CODE_SHAPE = /^[A-Za-z0-9_-]{24}$/u;
/** 다른 용도의 HMAC(식별값, 속도 제한)과 같은 입력이 섞이지 않도록 붙이는 접두사 */
const HASH_DOMAIN = "invite:";

export function generateInviteCode(): string {
	return bytesToBase64Url(
		crypto.getRandomValues(new Uint8Array(INVITE_CODE_BYTES)),
	);
}

/** 형식이 맞지 않는 입력은 DB를 조회하지 않고 거절한다 */
export function isInviteCodeShape(code: string): boolean {
	return INVITE_CODE_SHAPE.test(code);
}

export function inviteCodeHash(key: CryptoKey, code: string): Promise<string> {
	return hmacHex(key, `${HASH_DOMAIN}${code}`);
}
