import { z } from "zod";

export const SMS_MESSAGE_VERSION = 2;

/**
 * 큐 메시지 계약. 개인정보가 담긴 부분(payload)은 항상 암호문으로 보낸다.
 */

/** sms 큐: 렌더링이 끝난 문자 1건 */
export interface SmsMessage {
	/** 수신 번호·문자 본문·조회 권한 ID·멱등 키를 모두 포함한 암호문 */
	payload: string;
	version: typeof SMS_MESSAGE_VERSION;
	/** 메시지를 만든 요청의 requestId (로그 상관관계). 개인정보 아님 */
	traceId?: string;
}

/** 이전 배포의 대기 메시지도 읽되 발송 가능한 종류는 소비 경계에서 판단한다. */
export const SmsMessageSchema = z.discriminatedUnion("version", [
	z.object({
		version: z.literal(SMS_MESSAGE_VERSION),
		payload: z.string(),
		traceId: z.string().optional(),
	}),
	z.object({
		version: z.undefined().optional(),
		idempotencyKey: z.string(),
		kind: z.string(),
		payload: z.string(),
		submissionId: z.string(),
		traceId: z.string().optional(),
	}),
]);

export interface SmsPayload {
	text: string;
	to: string;
}

/** 복호화한 sms 큐 payload 검증 */
export const SmsPayloadSchema: z.ZodType<SmsPayload> = z.object({
	text: z.string(),
	to: z.string(),
});

/** v2는 열람 권한과 발송 문맥도 AES-GCM 인증 범위에 포함한다. */
export const SmsNotificationSchema = SmsPayloadSchema.and(
	z.object({
		submissionId: z.string(),
		idempotencyKey: z.string(),
		kind: z.string(),
	}),
);
export type SmsNotification = z.infer<typeof SmsNotificationSchema>;
export type QueuedSmsMessage = z.infer<typeof SmsMessageSchema>;
