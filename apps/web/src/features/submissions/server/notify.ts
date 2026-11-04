import { decryptJson, encryptJson } from "@jwc/common/crypto";
import { randomId } from "@jwc/common/encoding";
import type { Answers } from "@jwc/form-core/answers/value";
import type { FormDefinition } from "@jwc/form-core/definition/definition";
import { currentRequestId } from "@jwc/observability/scope";
import { queues } from "void/queues";

import { log } from "../../../platform/server/log";
import {
	dataKeys,
	smsMode,
	smsSender,
	submissionLink,
} from "../../../platform/server/runtime";
import { composeSms } from "../domain/submission-plan";
import type { NotificationIntent } from "../domain/submission-plan";
import { SmsPayloadSchema } from "./messages";
import type { SmsMessage } from "./messages";
import { findMessageByKey, recordDelivery } from "./submission-keys-repository";

/**
 * 알림 1건을 렌더링해 sms 큐에 넣는다. 연락처는 답변(저장소 원본)에서 읽는다.
 * 큐에는 개인정보를 암호문으로만 싣는다. 템플릿/연락처가 없으면 false.
 */
export async function enqueueNotification(
	definition: FormDefinition,
	answers: Answers,
	intent: NotificationIntent,
): Promise<boolean> {
	const sms = composeSms(
		definition,
		answers,
		intent,
		submissionLink(intent.submissionId),
	);
	if (!sms) {
		return false;
	}
	const keys = await dataKeys();
	const message: SmsMessage = {
		submissionId: intent.submissionId,
		kind: intent.kind,
		idempotencyKey: intent.idempotencyKey,
		payload: await encryptJson(keys.encryption, sms),
		traceId: currentRequestId(),
	};
	await queues.sms.send(message);
	return true;
}

/** sms 큐 소비: 이미 보낸 키면 건너뛴다 (at-least-once 큐에서 중복 발송 방지) */
export async function deliverSms(
	message: SmsMessage,
	now: number,
): Promise<"sent" | "duplicate"> {
	if (await findMessageByKey(message.idempotencyKey)) {
		return "duplicate";
	}
	const keys = await dataKeys();
	const { to, text } = SmsPayloadSchema.parse(
		await decryptJson(keys.encryption, message.payload),
	);
	const mode = smsMode();
	const result = await smsSender().send(to, text);
	await recordDelivery({
		id: randomId(),
		submissionId: message.submissionId,
		kind: message.kind,
		idempotencyKey: message.idempotencyKey,
		status: mode === "live" ? "sent" : "logged",
		providerMessageId: result.messageId,
		createdAt: now,
	});
	log.info("sms.delivered", {
		submissionId: message.submissionId,
		kind: message.kind,
		mode,
	});
	return "sent";
}
