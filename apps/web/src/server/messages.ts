import type { Answers, NotificationKind } from "@jwc/form-core";
import { z } from "zod";

import { keysOf } from "../lib/object";

/**
 * 큐 메시지 계약. 개인정보가 담긴 부분(payload)은 항상 암호문으로 보낸다.
 */

/** sheets 큐: 응답 → 시트 반영 */
export type SheetSyncMessage =
	| {
			kind: "upsert";
			submissionId: string;
			revision: number;
			/** encryptJson(SheetSyncPayload) */
			payload: string;
	  }
	| { kind: "paid"; submissionId: string; paid: boolean };

export interface SheetSyncPayload {
	answers: Answers;
	/** 시트 반영 후 보낼 알림 */
	notify: NotificationKind | null;
}

/** 알림 종류 목록. Record 키라서 form-core에 종류가 늘거나 줄면 타입 오류로 알려준다 */
const NOTIFICATION_KINDS: Record<NotificationKind, true> = {
	onCreate: true,
	onUpdate: true,
	onReminder: true,
};

const AnswerValueSchema = z.union([
	z.string(),
	z.number(),
	z.boolean(),
	z.array(z.string()),
]);

/** 복호화한 sheets 큐 payload 검증 (decryptJson은 형식을 보장하지 않는다) */
export const SheetSyncPayloadSchema: z.ZodType<SheetSyncPayload> = z.object({
	answers: z.record(z.string(), AnswerValueSchema),
	notify: z.enum(keysOf(NOTIFICATION_KINDS)).nullable(),
});

/** sms 큐: 렌더링이 끝난 문자 1건 */
export interface SmsMessage {
	/** 중복 발송 방지 키 (예: "<id>:onCreate:1", "<id>:onReminder:2") */
	idempotencyKey: string;
	kind: NotificationKind;
	/** encryptJson(SmsPayload) */
	payload: string;
	submissionId: string;
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
