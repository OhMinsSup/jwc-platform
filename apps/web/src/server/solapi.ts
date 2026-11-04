import { z } from "zod";

import { hmacWithSecret } from "./crypto";
import { bytesToHex } from "./encoding";

/**
 * Solapi SMS REST 클라이언트 (SDK는 Node 전용이라 fetch로 직접 구현).
 * 인증: HMAC-SHA256(apiSecret, date + salt) — https://developers.solapi.com 의 v4 인증 규격.
 */

const SEND_URL = "https://api.solapi.com/messages/v4/send";
const SALT_BYTES = 16;

/** 발송 성공(2xx) 응답에서 기록용 식별자만 꺼낸다 */
const SendResponseSchema = z.object({
	messageId: z.string().optional(),
	groupId: z.string().optional(),
});

export class SmsSendError extends Error {
	override name = "SmsSendError";
	readonly retryable: boolean;
	constructor(message: string, retryable: boolean) {
		super(message);
		this.retryable = retryable;
	}
}

export interface SolapiConfig {
	apiKey: string;
	apiSecret: string;
	sender: string;
}

export interface SmsSender {
	send: (to: string, text: string) => Promise<{ messageId: string }>;
}

export async function solapiAuthHeader(
	config: SolapiConfig,
	date: string,
	salt: string,
): Promise<string> {
	const signature = await hmacWithSecret(config.apiSecret, date + salt);
	return `HMAC-SHA256 apiKey=${config.apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

export function createSolapiSender(
	config: SolapiConfig,
	fetchImpl: typeof fetch = fetch,
	now: () => Date = () => new Date(),
): SmsSender {
	return {
		async send(to, text) {
			const date = now().toISOString();
			const salt = bytesToHex(
				crypto.getRandomValues(new Uint8Array(SALT_BYTES)),
			);
			const response = await fetchImpl(SEND_URL, {
				method: "POST",
				headers: {
					authorization: await solapiAuthHeader(config, date, salt),
					"content-type": "application/json",
				},
				body: JSON.stringify({ message: { to, from: config.sender, text } }),
			});
			if (!response.ok) {
				const retryable = response.status === 429 || response.status >= 500;
				throw new SmsSendError(`Solapi HTTP ${response.status}`, retryable);
			}
			const json: unknown = await response.json();
			// 이미 발송된 뒤라 식별자 형식이 예상과 달라도 실패로 보지 않는다 (재시도 시 중복 발송 방지)
			const parsed = SendResponseSchema.safeParse(json);
			const body = parsed.success ? parsed.data : {};
			return { messageId: body.messageId ?? body.groupId ?? "" };
		},
	};
}

/** 개발/스테이징용: 실제 발송 없이 성공 처리 */
export const loggingSender: SmsSender = {
	send: () => Promise.resolve({ messageId: "logged" }),
};
