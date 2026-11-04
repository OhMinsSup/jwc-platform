import { defineQueue } from "void";

import type { SmsMessage } from "../src/features/submissions/server/messages";
import { deliverSms } from "../src/features/submissions/server/notify";
import { classifyError } from "../src/platform/server/errors/classify";
import { captureException, log } from "../src/platform/server/log";

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
				traceId: message.body.traceId,
			});
			message.ack();
		} catch (error) {
			const failure = classifyError(error);
			log[failure.spec.level]("sms.failed", {
				submissionId: message.body.submissionId,
				kind: message.body.kind,
				code: failure.code,
				attempts: message.attempts,
				error: failure.internalMessage,
				traceId: message.body.traceId,
			});
			captureException(failure, "queue.sms");
			if (failure.spec.retryable) {
				message.retry();
			} else {
				message.ack();
			}
		}
	}
});
