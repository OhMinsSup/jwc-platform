/**
 * 암호화 유틸리티
 *
 * AES-GCM을 사용한 대칭 암호화와 SHA-256 해싱을 제공합니다.
 * Convex Node.js 런타임에서만 사용하는 것을 권장합니다.
 */

import { webcrypto } from "node:crypto";

// Node.js webcrypto 타입 alias
type NodeCryptoKey = webcrypto.CryptoKey;

const crypto = webcrypto;

export interface EncryptedData {
	/** 암호화된 데이터 (Base64) */
	ciphertext: string;
	/** 초기화 벡터 (Base64) */
	iv: string;
}

export interface EncryptedPersonalInfo {
	/** 암호화된 이름 */
	encryptedName: EncryptedData;
	/** 암호화된 전화번호 */
	encryptedPhone: EncryptedData;
	/** 전화번호 해시 (검색용) */
	phoneHash: string;
}

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // GCM 권장 IV 길이

/**
 * Uint8Array를 Base64 문자열로 변환
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
	return Buffer.from(bytes).toString("base64");
}

/**
 * Base64 문자열을 Uint8Array로 변환
 */
function base64ToUint8Array(base64: string): Uint8Array {
	return new Uint8Array(Buffer.from(base64, "base64"));
}

/**
 * 문자열을 Uint8Array로 변환
 */
function stringToUint8Array(str: string): Uint8Array {
	return new Uint8Array(Buffer.from(str, "utf-8"));
}

/**
 * ArrayBuffer를 문자열로 변환
 */
function arrayBufferToString(buffer: ArrayBuffer): string {
	return Buffer.from(buffer).toString("utf-8");
}

/**
 * 암호화 키 생성 (환경 변수에서 비밀키를 가져와 키 파생)
 */
export async function deriveKey(secret: string): Promise<NodeCryptoKey> {
	const keyMaterial = await crypto.subtle.importKey(
"raw",
stringToUint8Array(secret),
"PBKDF2",
false,
["deriveKey"]
);

	return crypto.subtle.deriveKey(
{
name: "PBKDF2",
// 고정된 salt 사용 (동일한 비밀키로 동일한 암호화 키 생성)
salt: stringToUint8Array("jwc-form-salt-v1"),
iterations: 100_000,
hash: "SHA-256",
},
keyMaterial,
{ name: ALGORITHM, length: KEY_LENGTH },
false,
["encrypt", "decrypt"]
);
}

/**
 * 데이터 암호화
 */
export async function encrypt(
plaintext: string,
key: NodeCryptoKey
): Promise<EncryptedData> {
	// 랜덤 IV 생성
	const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

	// 암호화
	const ciphertext = await crypto.subtle.encrypt(
{ name: ALGORITHM, iv },
key,
stringToUint8Array(plaintext)
);

	return {
		ciphertext: uint8ArrayToBase64(new Uint8Array(ciphertext)),
		iv: uint8ArrayToBase64(iv),
	};
}

/**
 * 데이터 복호화
 */
export async function decrypt(
encryptedData: EncryptedData,
key: NodeCryptoKey
): Promise<string> {
	const iv = base64ToUint8Array(encryptedData.iv);
	const ciphertext = base64ToUint8Array(encryptedData.ciphertext);

	const plaintext = await crypto.subtle.decrypt(
{ name: ALGORITHM, iv },
key,
ciphertext
);

	return arrayBufferToString(plaintext);
}

/**
 * SHA-256 해시 생성
 * - 검색/식별용으로 사용 (암호화와 별개)
 */
export async function hash(data: string): Promise<string> {
	const hashBuffer = await crypto.subtle.digest(
"SHA-256",
stringToUint8Array(data)
);
	return uint8ArrayToBase64(new Uint8Array(hashBuffer));
}

/**
 * 전화번호 정규화 후 해시
 * - 하이픈 제거, 공백 제거 후 해시
 */
export function hashPhone(phone: string): Promise<string> {
	const normalizedPhone = phone.replace(/[-\s]/g, "");
	return hash(normalizedPhone);
}

/**
 * 개인정보 암호화 (이름, 전화번호)
 */
export async function encryptPersonalInfo(
name: string,
phone: string,
key: NodeCryptoKey
): Promise<EncryptedPersonalInfo> {
	const [encryptedName, encryptedPhone, phoneHash] = await Promise.all([
encrypt(name, key),
encrypt(phone, key),
hashPhone(phone),
]);

	return {
		encryptedName,
		encryptedPhone,
		phoneHash,
	};
}

/**
 * 개인정보 복호화 (이름, 전화번호)
 */
export async function decryptPersonalInfo(
encryptedName: EncryptedData,
encryptedPhone: EncryptedData,
key: NodeCryptoKey
): Promise<{ name: string; phone: string }> {
	const [name, phone] = await Promise.all([
decrypt(encryptedName, key),
decrypt(encryptedPhone, key),
]);

	return { name, phone };
}

/**
 * EncryptedData를 JSON 문자열로 변환
 */
export function encryptedDataToString(data: EncryptedData): string {
	return JSON.stringify(data);
}

/**
 * JSON 문자열을 EncryptedData로 변환
 */
export function stringToEncryptedData(str: string): EncryptedData {
	return JSON.parse(str) as EncryptedData;
}
