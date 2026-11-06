import { createHmac } from "node:crypto";

import { jsonBody, recordingFetch, rejectionOf } from "@jwc/common/testing";
import { describe, expect, it } from "vite-plus/test";

import {
	createSolapiSender,
	SmsSendError,
	solapiAuthHeader,
} from "../src/platform/server/solapi";

const config = { apiKey: "KEY", apiSecret: "SECRET", sender: "0212345678" };

/** 주어진 상태 코드로 실패하는 전송의 오류 */
function sendError(status: number) {
	return rejectionOf(
		createSolapiSender(
			config,
			recordingFetch([new Response("x", { status })]).impl,
		).send("01012345678", "x"),
		SmsSendError,
	);
}

describe("Solapi 클라이언트", () => {
	it("인증 헤더 = HMAC-SHA256(secret, date+salt)", async () => {
		const header = await solapiAuthHeader(
			config,
			"2026-11-02T00:00:00.000Z",
			"abc",
		);
		const expected = createHmac("sha256", "SECRET")
			.update("2026-11-02T00:00:00.000Zabc")
			.digest("hex");
		expect(header).toBe(
			`HMAC-SHA256 apiKey=KEY, date=2026-11-02T00:00:00.000Z, salt=abc, signature=${expected}`,
		);
	});

	it("발신번호와 본문을 담아 전송하고 messageId를 돌려준다", async () => {
		const fake = recordingFetch([Response.json({ messageId: "M1" })]);
		const result = await createSolapiSender(config, fake.impl).send(
			"01012345678",
			"안녕하세요",
		);
		expect(result.messageId).toBe("M1");
		expect(jsonBody(fake.calls[0])).toStrictEqual({
			message: { to: "01012345678", from: "0212345678", text: "안녕하세요" },
		});
	});

	it("4xx는 재시도 불가, 5xx는 재시도 가능", async () => {
		const clientError = await sendError(400);
		const serverError = await sendError(500);
		expect(clientError.retryable).toBe(false);
		expect(serverError.retryable).toBe(true);
	});
});
