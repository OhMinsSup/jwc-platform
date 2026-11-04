import { defineQueue } from "void";

import { SheetsApiError } from "../src/server/google/sheets-client";
import { errorMessage, log } from "../src/server/log";
import type { SheetSyncMessage } from "../src/server/messages";
import { handleSheetSync } from "../src/server/services/sync";

/** 배치/재시도 옵션은 void.config.ts(QUEUES 상수)에서 선언한다. */

const BUSY_RETRY_SECONDS = 10;

export default defineQueue<SheetSyncMessage>(async (batch) => {
	for (const message of batch.messages) {
		try {
			// oxlint-disable-next-line no-await-in-loop -- 메시지마다 응답 단위 임대 락을 잡으므로 순서대로 처리한다 (병렬 시 같은 행 경합)
			const outcome = await handleSheetSync(message.body, Date.now());
			if (outcome === "busy") {
				message.retry({ delaySeconds: BUSY_RETRY_SECONDS });
				continue;
			}
			log.info("sheet_sync.processed", {
				submissionId: message.body.submissionId,
				kind: message.body.kind,
				outcome,
			});
			message.ack();
		} catch (error) {
			const retryable = !(error instanceof SheetsApiError) || error.retryable;
			log.error("sheet_sync.failed", {
				submissionId: message.body.submissionId,
				attempts: message.attempts,
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
