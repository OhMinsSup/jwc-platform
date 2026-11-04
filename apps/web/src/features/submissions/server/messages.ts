import type { NotificationKind } from "@jwc/form-core/definition/definition";
import { z } from "zod";

/**
 * 큐 메시지 계약. 개인정보가 담긴 부분(payload)은 항상 암호문으로 보낸다.
 */

/** sms 큐: 렌더링이 끝난 문자 1건 */
export interface SmsMessage {
	/** 중복 발송 방지 키 (예: "<id>:onCreate:1", "<id>:onReminder:2") */
	idempotencyKey: string;
	kind: NotificationKind;
	/** encryptJson(SmsPayload) */
	payload: string;
	submissionId: string;
	/** 메시지를 만든 요청의 requestId (로그 상관관계). 개인정보 아님 */
	traceId?: string;
}

export interface SmsPayload {
	text: string;
	to: string;
}

/** 복호화한 sms 큐 payload 검증 */
export const SmsPayloadSchema: z.ZodType<SmsPayload> = z.object({
	text: z.string(),
	to: z.string(),
});
