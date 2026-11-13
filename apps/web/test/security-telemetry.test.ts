import { createLogger } from "@jwc/observability";
import { createScope, runInScope } from "@jwc/observability/scope";
import { describe, expect, it, vi } from "vite-plus/test";

import { SERVER_EVENTS } from "../src/platform/server/telemetry/events";

describe("신청 열람 토큰의 관측 전송 방지", () => {
	it("제출·납입·문자 로그와 제품 분석 이벤트에서 열람 토큰을 제거한다", () => {
		const output = vi.spyOn(console, "log").mockReturnValue(undefined);
		const token = "private-submission-capability-fixture";
		const fields = {
			submissionId: token,
			formId: "public-form",
			paid: true,
			revision: 1,
			isNew: true,
			kind: "onCreate",
			mode: "log",
			traceId: "safe-trace",
			result: "sent",
		};
		const scope = createScope("safe-request");
		const logger = createLogger(SERVER_EVENTS);
		try {
			runInScope(scope, () => {
				logger.info("submission.stored", fields);
				logger.info("submission.paid_changed", fields);
				logger.info("sms.delivered", fields);
				logger.info("sms.processed", fields);
			});
			expect(output).toHaveBeenCalledTimes(4);
			expect(JSON.stringify(output.mock.calls)).not.toContain(token);
			expect(scope.captured).toHaveLength(3);
			expect(JSON.stringify(scope.captured)).not.toContain(token);
			expect(JSON.stringify(output.mock.calls)).toContain("safe-request");
		} finally {
			output.mockRestore();
		}
	});
});
