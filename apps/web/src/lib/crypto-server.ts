import { deriveKey, encryptPersonalInfo, hashPhone } from "@jwc/utils";
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
