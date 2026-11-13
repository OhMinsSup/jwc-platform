import { expect, test } from "@playwright/test";

const CHUNK_BYTES = 262_144;
const CHUNK_COUNT = 5;
const REQUEST_TIMEOUT_MS = 15_000;

test("인증 조회 응답은 캐시와 리퍼러 전송을 금지한다", async ({ request }) => {
	const response = await request.get("/api/auth/get-session");
	expect(response.status()).toBe(200);
	expect(response.headers()["cache-control"]).toBe("no-store");
	expect(response.headers()["referrer-policy"]).toBe("no-referrer");
});

test("Content-Length 없는 초과 스트림은 인증 처리 전에 413으로 거절한다", async ({
	baseURL,
}) => {
	if (!baseURL) {
		throw new Error("테스트 baseURL이 필요합니다");
	}
	const init = {
		method: "POST",
		headers: { origin: baseURL, "content-type": "application/json" },
		duplex: "half" as const,
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
		body: new ReadableStream({
			start(controller) {
				for (let index = 0; index < CHUNK_COUNT; index += 1) {
					controller.enqueue(new Uint8Array(CHUNK_BYTES));
				}
				controller.close();
			},
		}),
	};
	const response = await fetch(
		new Request(`${baseURL}/api/auth/sign-in/email`, init),
	);
	expect(response.status).toBe(413);
	expect(response.headers.get("cache-control")).toBe("no-store");
});

test("Origin이 없는 교차 사이트 브라우저 POST도 403으로 거절한다", async ({
	request,
}) => {
	const response = await request.post("/api/auth/sign-in/email", {
		headers: { "sec-fetch-site": "cross-site" },
		data: {},
	});
	expect(response.status()).toBe(403);
});
