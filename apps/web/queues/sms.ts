import { defineQueue } from "void";

import { errorMessage, log } from "../src/server/log";
import type { SmsMessage } from "../src/server/messages";
import { deliverSms } from "../src/server/services/notify";
import { SmsSendError } from "../src/server/solapi";

/** 배치/재시도 옵션은 void.config.ts(QUEUES 상수)에서 선언한다. */

export default defineQueue<SmsMessage>(async (batch) => {
	for (const message of batch.messages) {
		try {
			// oxlint-disable-next-line no-await-in-loop -- 발송 업체 속도 제한과 멱등 키 기록 순서를 지키기 위해 순차 발송한다
			const result = await deliverSms(message.body, Date.now());
			log.info("sms.processed", {
				submissionId: message.body.submissionId,
				kind: message.body.kind,
				result,
			});
			message.ack();
		} catch (error) {
			const retryable = !(error instanceof SmsSendError) || error.retryable;
			log.error("sms.failed", {
				submissionId: message.body.submissionId,
				kind: message.body.kind,
				retryable,
				error: errorMessage(error),
			});
			if (retryable) {
				message.retry();
			} else {
				message.ack();
			}
		}
	}
});
