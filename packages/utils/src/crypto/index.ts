/**
 * 암호화 유틸리티
 *
 * AES-GCM을 사용한 대칭 암호화와 SHA-256 해싱을 제공합니다.
 * 클라이언트와 서버 모두에서 사용 가능합니다.
 */

// ============================================================
// 타입 정의
// ============================================================

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

// ============================================================
// 상수
// ============================================================

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // GCM 권장 IV 길이

// ============================================================
// 유틸리티 함수
// ============================================================

/**
 * ArrayBuffer를 Base64 문자열로 변환
 */
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
	const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
	let binary = "";
	for (let i = 0; i < bytes.byteLength; i++) {
		const byte = bytes[i];
		if (byte !== undefined) {
			binary += String.fromCharCode(byte);
		}
	}
	return btoa(binary);
}

/**
 * Base64 문자열을 ArrayBuffer로 변환
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes.buffer;
}

/**
 * 문자열을 ArrayBuffer로 변환
 */
function stringToArrayBuffer(str: string): ArrayBuffer {
	const encoder = new TextEncoder();
	return encoder.encode(str).buffer as ArrayBuffer;
}

/**
 * ArrayBuffer를 문자열로 변환
 */
function arrayBufferToString(buffer: ArrayBuffer): string {
	const decoder = new TextDecoder();
	return decoder.decode(buffer);
}

/**
 * 암호화 키 생성 (환경 변수에서 비밀키를 가져와 키 파생)
 */
export async function deriveKey(secret: string): Promise<CryptoKey> {
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		stringToArrayBuffer(secret),
		"PBKDF2",
		false,
		["deriveKey"]
	);

	return crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			// 고정된 salt 사용 (동일한 비밀키로 동일한 암호화 키 생성)
			salt: stringToArrayBuffer("jwc-form-salt-v1"),
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
	key: CryptoKey
): Promise<EncryptedData> {
	// 랜덤 IV 생성
	const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

	// 암호화
	const ciphertext = await crypto.subtle.encrypt(
		{ name: ALGORITHM, iv },
		key,
		stringToArrayBuffer(plaintext)
	);

	return {
		ciphertext: arrayBufferToBase64(ciphertext),
		iv: arrayBufferToBase64(iv),
	};
}

/**
 * 데이터 복호화
 */
export async function decrypt(
	encryptedData: EncryptedData,
	key: CryptoKey
): Promise<string> {
	const iv = base64ToArrayBuffer(encryptedData.iv);
	const ciphertext = base64ToArrayBuffer(encryptedData.ciphertext);

	const plaintext = await crypto.subtle.decrypt(
		{ name: ALGORITHM, iv: new Uint8Array(iv) },
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
		stringToArrayBuffer(data)
	);
	return arrayBufferToBase64(hashBuffer);
}

/**
 * 전화번호 정규화 후 해시
 * - 하이픈 제거, 공백 제거 후 해시
 */
export async function hashPhone(phone: string): Promise<string> {
	const normalizedPhone = phone.replace(/[-\s]/g, "");
	return await hash(normalizedPhone);
}

/**
 * 개인정보 암호화 (이름, 전화번호)
 */
export async function encryptPersonalInfo(
	name: string,
	phone: string,
	key: CryptoKey
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
	key: CryptoKey
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
