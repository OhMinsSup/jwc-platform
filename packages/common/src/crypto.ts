import { base64ToBytes, bytesToBase64, bytesToHex, utf8 } from "./encoding";

/**
 * 개인정보 보호용 암호 유틸 (WebCrypto만 사용).
 * 마스터 키 1개(DATA_KEY)에서 HKDF로 용도별 키를 파생한다 → 키 하나가 새도 용도 간 교차 사용 불가.
 */

const CIPHER_VERSION = "v1";
const IV_BYTES = 12;
const MASTER_KEY_BYTES = 32;

export class CryptoConfigError extends Error {
	override name = "CryptoConfigError";
}

export interface DataKeys {
	encryption: CryptoKey;
	identity: CryptoKey;
}

function hkdf(
	master: CryptoKey,
	info: string,
	usage: "encrypt" | "sign",
): Promise<CryptoKey> {
	const params = {
		name: "HKDF",
		hash: "SHA-256",
		salt: new Uint8Array(0),
		info: utf8(info),
	};
	const algorithm =
		usage === "encrypt"
			? { name: "AES-GCM", length: 256 }
			: { name: "HMAC", hash: "SHA-256", length: 256 };
	const usages: KeyUsage[] =
		usage === "encrypt" ? ["encrypt", "decrypt"] : ["sign"];
	return crypto.subtle.deriveKey(params, master, algorithm, false, usages);
}

export async function deriveDataKeys(masterBase64: string): Promise<DataKeys> {
	const raw = base64ToBytes(masterBase64);
	if (raw.length !== MASTER_KEY_BYTES) {
		throw new CryptoConfigError(
			"DATA_KEY는 base64로 인코딩된 32바이트여야 합니다",
		);
	}
	const master = await crypto.subtle.importKey("raw", raw, "HKDF", false, [
		"deriveKey",
	]);
	const [encryption, identity] = await Promise.all([
		hkdf(master, "jwc-form/encryption/v1", "encrypt"),
		hkdf(master, "jwc-form/identity/v1", "sign"),
	]);
	return { encryption, identity };
}

/** 평문 → "v1.<iv>.<ciphertext>" */
export async function encryptText(
	key: CryptoKey,
	plaintext: string,
): Promise<string> {
	const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
	const cipher = new Uint8Array(
		await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, utf8(plaintext)),
	);
	return [CIPHER_VERSION, bytesToBase64(iv), bytesToBase64(cipher)].join(".");
}

export async function decryptText(
	key: CryptoKey,
	token: string,
): Promise<string> {
	const [version, iv, cipher] = token.split(".");
	if (version !== CIPHER_VERSION || !iv || !cipher) {
		throw new CryptoConfigError("지원하지 않는 암호문 형식입니다");
	}
	const plain = await crypto.subtle.decrypt(
		{ name: "AES-GCM", iv: base64ToBytes(iv) },
		key,
		base64ToBytes(cipher),
	);
	return new TextDecoder().decode(plain);
}

/** 키 기반 해시. 전화번호처럼 경우의 수가 작은 값도 키 없이는 역산할 수 없다. */
export async function hmacHex(
	key: CryptoKey,
	message: string,
): Promise<string> {
	return bytesToHex(
		new Uint8Array(await crypto.subtle.sign("HMAC", key, utf8(message))),
	);
}

/** 외부 공유 비밀(웹훅 등)로 HMAC-SHA256 서명 */
export async function hmacWithSecret(
	secret: string,
	message: string,
): Promise<string> {
	const key = await crypto.subtle.importKey(
		"raw",
		utf8(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	return await hmacHex(key, message);
}

export function encryptJson(key: CryptoKey, value: unknown): Promise<string> {
	return encryptText(key, JSON.stringify(value));
}

/** 형식은 보장하지 않는다: 호출부가 메시지 계약 스키마(messages.ts)로 검증한다 */
export async function decryptJson(
	key: CryptoKey,
	token: string,
): Promise<unknown> {
	const plaintext = await decryptText(key, token);
	return JSON.parse(plaintext);
}
