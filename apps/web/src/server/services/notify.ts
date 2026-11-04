import { messageVariables, renderTemplate, templateFor } from "@jwc/form-core";
import type { Answers, FormDefinition, NotificationKind } from "@jwc/form-core";
import { queues } from "void/queues";

import { decryptJson, decryptText, encryptJson } from "../crypto";
import { randomId } from "../encoding";
import { log } from "../log";
import { SmsPayloadSchema } from "../messages";
import type { SmsMessage, SmsPayload } from "../messages";
import { findMessageByKey, recordDelivery } from "../repositories/submissions";
import type { SubmissionRow } from "../repositories/submissions";
import { dataKeys, smsMode, smsSender, submissionLink } from "../runtime";

/** 템플릿 렌더링 후 sms 큐에 넣는다. 템플릿이나 연락처가 없으면 아무것도 하지 않는다. */
export async function enqueueNotification(
	definition: FormDefinition,
	submission: Pick<SubmissionRow, "id" | "contactCipher">,
	answers: Answers,
	kind: NotificationKind,
	idempotencyKey: string,
): Promise<boolean> {
	const template = templateFor(definition, kind);
	if (!(template && submission.contactCipher)) {
		return false;
	}
	const keys = await dataKeys();
	const to = await decryptText(keys.encryption, submission.contactCipher);
	const variables = messageVariables(definition, answers, {
		submissionId: submission.id,
		link: submissionLink(submission.id),
	});
	const payload: SmsPayload = { to, text: renderTemplate(template, variables) };
	const message: SmsMessage = {
		submissionId: submission.id,
		kind,
		idempotencyKey,
		payload: await encryptJson(keys.encryption, payload),
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
	await recordDelivery(
		{
			id: randomId(),
			submissionId: message.submissionId,
			kind: message.kind,
			idempotencyKey: message.idempotencyKey,
			status: mode === "live" ? "sent" : "logged",
			providerMessageId: result.messageId,
			createdAt: now,
		},
		now,
	);
	log.info("sms.delivered", {
		submissionId: message.submissionId,
		kind: message.kind,
		mode,
	});
	return "sent";
}
