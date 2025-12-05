import {
	decrypt,
	deriveKey,
	encrypt,
	encryptPersonalInfo,
	hashPhone,
	type EncryptedData,
} from "@jwc/utils";
import { createServerFn } from "@tanstack/react-start";

// 서버에서만 접근 가능한 암호화 키
const AES_KEY = process.env.AES_KEY;

// 키 캐싱을 위한 변수
let cachedKey: CryptoKey | null = null;

/**
 * 암호화 키 가져오기 (캐싱)
 */
async function getEncryptionKey(): Promise<CryptoKey> {
	if (cachedKey) {
		return cachedKey;
	}

	if (!AES_KEY) {
		throw new Error("AES_KEY is not configured on the server");
	}

	cachedKey = await deriveKey(AES_KEY);
	return cachedKey;
}

/**
 * 개인정보 암호화 서버 함수
 * - 이름과 전화번호를 받아서 암호화된 데이터와 해시를 반환
 */
export const encryptPersonalInfoServer = createServerFn({ method: "POST" })
	.inputValidator((data: { name: string; phone: string }) => data)
	.handler(async ({ data }) => {
		const { name, phone } = data;

		if (!name) {
			throw new Error("Name is required");
		}
		if (!phone) {
			throw new Error("Phone is required");
		}

		try {
			const key = await getEncryptionKey();
			const encryptedInfo = await encryptPersonalInfo(name, phone, key);

			return {
				success: true as const,
				data: encryptedInfo,
			};
		} catch (error) {
			console.error("[Server] Encryption failed:", error);
			throw new Error("Failed to encrypt personal information");
		}
	});

/**
 * 전화번호 해시 서버 함수
 * - 전화번호를 받아서 해시를 반환 (검색용)
 */
export const getPhoneHashServer = createServerFn({ method: "POST" })
	.inputValidator((data: { phone: string }) => data)
	.handler(async ({ data }) => {
		const { phone } = data;

		if (!phone) {
			throw new Error("Phone is required");
		}

		try {
			const hash = await hashPhone(phone);
			return {
				success: true as const,
				data: hash,
			};
		} catch (error) {
			console.error("[Server] Hashing failed:", error);
			throw new Error("Failed to hash phone number");
		}
	});

// ============================================================
// Draft용 암호화/복호화 함수
// ============================================================

/**
 * Draft 개인정보 암호화 서버 함수
 * - 이름과 전화번호를 암호화하여 JSON 문자열로 반환
 */
export const encryptDraftPersonalInfoServer = createServerFn({ method: "POST" })
	.inputValidator((data: { name?: string; phone?: string }) => data)
	.handler(async ({ data }) => {
		const { name, phone } = data;

		try {
			const key = await getEncryptionKey();

			const result: { encryptedName?: string; encryptedPhone?: string } = {};

			if (name) {
				const encrypted = await encrypt(name, key);
				result.encryptedName = JSON.stringify(encrypted);
			}

			if (phone) {
				const encrypted = await encrypt(phone, key);
				result.encryptedPhone = JSON.stringify(encrypted);
			}

			return {
				success: true as const,
				data: result,
			};
		} catch (error) {
			console.error("[Server] Draft encryption failed:", error);
			throw new Error("Failed to encrypt draft personal information");
		}
	});

/**
 * Draft 개인정보 복호화 서버 함수
 * - 암호화된 JSON 문자열을 복호화하여 평문으로 반환
 */
export const decryptDraftPersonalInfoServer = createServerFn({ method: "POST" })
	.inputValidator(
		(data: { encryptedName?: string; encryptedPhone?: string }) => data
	)
	.handler(async ({ data }) => {
		const { encryptedName, encryptedPhone } = data;

		try {
			const key = await getEncryptionKey();

			const result: { name?: string; phone?: string } = {};

			if (encryptedName) {
				const parsed = JSON.parse(encryptedName) as EncryptedData;
				result.name = await decrypt(parsed, key);
			}

			if (encryptedPhone) {
				const parsed = JSON.parse(encryptedPhone) as EncryptedData;
				result.phone = await decrypt(parsed, key);
			}

			return {
				success: true as const,
				data: result,
			};
		} catch (error) {
			console.error("[Server] Draft decryption failed:", error);
			throw new Error("Failed to decrypt draft personal information");
		}
	});
