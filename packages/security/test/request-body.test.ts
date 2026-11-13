import { describe, expect, it } from "vite-plus/test";

import { limitRequestBody, PayloadTooLargeError } from "../src/request-body";

const SITE = "https://forms.example.test/_serverFn/test";
const LIMIT = 5;

function streamed(chunks: string[], headers?: HeadersInit) {
	const init = {
		method: "POST",
		headers,
		duplex: "half" as const,
		body: new ReadableStream({
			start(controller) {
				for (const chunk of chunks) {
					controller.enqueue(new TextEncoder().encode(chunk));
				}
				controller.close();
			},
		}),
	};
	return new Request(SITE, init);
}

describe("실제 요청 본문 상한", () => {
	it("Content-Length 없는 스트림도 실제 바이트가 상한을 넘으면 거절한다", async () => {
		await expect(
			limitRequestBody(streamed(["abc", "def"]), LIMIT),
		).rejects.toBeInstanceOf(PayloadTooLargeError);
	});

	it("작게 선언한 길이로 상한을 우회할 수 없다", async () => {
		await expect(
			limitRequestBody(streamed(["abcdef"], { "content-length": "1" }), LIMIT),
		).rejects.toBeInstanceOf(PayloadTooLargeError);
	});

	it("문자 수가 아닌 UTF-8 바이트 수로 제한한다", async () => {
		await expect(
			limitRequestBody(streamed(["가나"]), LIMIT),
		).rejects.toBeInstanceOf(PayloadTooLargeError);
	});

	it("상한 이하 본문·메서드·인증 헤더와 URL을 핸들러에 전달한다", async () => {
		const forwarded = await limitRequestBody(
			streamed(["abc", "de"], {
				cookie: "test-only-session=fixture",
				"content-type": "application/json",
			}),
			LIMIT,
		);
		expect(forwarded.url).toBe(SITE);
		expect(forwarded.method).toBe("POST");
		expect(forwarded.headers.get("cookie")).toBe("test-only-session=fixture");
		expect(forwarded.headers.get("content-type")).toBe("application/json");
		await expect(forwarded.text()).resolves.toBe("abcde");
	});

	it("본문 없는 요청은 그대로 전달한다", async () => {
		const request = new Request(SITE, { method: "POST" });
		await expect(limitRequestBody(request, LIMIT)).resolves.toBe(request);
	});
});
