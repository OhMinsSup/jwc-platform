import { recordingFetch } from "@jwc/common/testing";
import { describe, expect, it } from "vite-plus/test";

import { buildCsp, privacyHeaders, withHeaders } from "../src/headers";
import { createRateLimiter, RateLimitExceededError } from "../src/rate-limit";
import type { BucketStore } from "../src/rate-limit";
import { judgeRequest } from "../src/request-policy";
import type { RequestPolicy } from "../src/request-policy";
import { verifyTurnstile } from "../src/turnstile";

const SITE = "https://app.example";

const POLICY: RequestPolicy<"login"> = {
	siteOrigin: SITE,
	guardedPrefixes: ["/rpc/", "/api/"],
	maxBodyBytes: 100,
	rules: [
		{
			prefix: "/api/signup",
			action: { kind: "reject", status: 403, message: "닫힘" },
		},
		{ prefix: "/api/login", action: { kind: "rate_limit", rule: "login" } },
	],
};

function post(path: string, headers: Record<string, string> = {}): Request {
	return new Request(`${SITE}${path}`, { method: "POST", headers });
}

describe(judgeRequest, () => {
	it("Origin이 없는 브라우저의 cross-site 상태 변경도 거절한다", () => {
		expect(
			judgeRequest(post("/rpc/x", { "sec-fetch-site": "cross-site" }), POLICY),
		).toMatchObject({ kind: "reject", status: 403 });
	});

	it("같은 출처 요청은 허용한다", () => {
		expect(
			judgeRequest(post("/rpc/x", { origin: SITE }), POLICY),
		).toStrictEqual({
			kind: "allow",
		});
	});

	it("회귀(CSRF): 다른 출처의 상태 변경 요청은 거절한다", () => {
		expect(
			judgeRequest(post("/rpc/x", { origin: "https://evil.example" }), POLICY),
		).toMatchObject({ kind: "reject", status: 403 });
	});

	it("본문 상한을 넘으면 413", () => {
		expect(
			judgeRequest(post("/rpc/x", { "content-length": "101" }), POLICY),
		).toMatchObject({ kind: "reject", status: 413 });
	});

	it("경로 규칙: 처음 맞는 규칙 하나를 적용한다", () => {
		expect(judgeRequest(post("/api/signup/email"), POLICY)).toMatchObject({
			kind: "reject",
			message: "닫힘",
		});
		expect(judgeRequest(post("/api/login/email"), POLICY)).toStrictEqual({
			kind: "rate_limit",
			rule: "login",
		});
	});

	it("조회(GET)와 검사 대상 밖 경로는 건드리지 않는다", () => {
		const get = new Request(`${SITE}/rpc/x`, {
			headers: { origin: "https://evil.example" },
		});
		expect(judgeRequest(get, POLICY)).toStrictEqual({ kind: "allow" });
		expect(
			judgeRequest(post("/page", { origin: "https://evil.example" }), POLICY),
		).toStrictEqual({ kind: "allow" });
	});
});

describe(buildCsp, () => {
	it("지시어 표를 문자열로 만들고, 빈 목록은 'none'", () => {
		expect(buildCsp({ "default-src": ["'self'"], "object-src": [] })).toBe(
			"default-src 'self'; object-src 'none'",
		);
	});
});

describe(privacyHeaders, () => {
	it("비공개 경로만 no-store/noindex", () => {
		expect(privacyHeaders("/r/1", [/^\/r\//u])).toMatchObject({
			"cache-control": "no-store",
		});
		expect(privacyHeaders("/f/1", [/^\/r\//u])).toStrictEqual({});
	});
});

describe(withHeaders, () => {
	it("상태와 본문을 유지하고 헤더를 덧붙인다", async () => {
		const response = withHeaders(new Response("body", { status: 201 }), {
			"x-test": "1",
		});
		expect(response.status).toBe(201);
		expect(response.headers.get("x-test")).toBe("1");
		await expect(response.text()).resolves.toBe("body");
	});
});

/** 메모리 고정 창 카운터 (D1 구현과 같은 의미) */
function memoryStore(): BucketStore {
	const buckets = new Map<string, { count: number; start: number }>();
	return {
		hit: (key, now, windowMs) => {
			const bucket = buckets.get(key);
			const next =
				bucket && bucket.start > now - windowMs
					? { count: bucket.count + 1, start: bucket.start }
					: { count: 1, start: now };
			buckets.set(key, next);
			return Promise.resolve(next.count);
		},
	};
}

describe(createRateLimiter, () => {
	const limiter = createRateLimiter({
		rules: { login: { max: 2, windowMs: 1000 } },
		store: memoryStore(),
		hashSubject: (subject) => Promise.resolve(`h(${subject})`),
	});

	it("최대 횟수까지 허용하고 넘으면 RateLimitExceededError", async () => {
		await limiter.enforce("login", "1.1.1.1", 0);
		await limiter.enforce("login", "1.1.1.1", 10);
		await expect(
			limiter.enforce("login", "1.1.1.1", 20),
		).rejects.toBeInstanceOf(RateLimitExceededError);
	});

	it("창이 지나면 다시 센다, 대상마다 따로 센다", async () => {
		await expect(
			limiter.enforce("login", "1.1.1.1", 2000),
		).resolves.toBeUndefined();
		await expect(
			limiter.enforce("login", "2.2.2.2", 20),
		).resolves.toBeUndefined();
		expect(limiter.longestWindowMs).toBe(1000);
	});
});

describe(verifyTurnstile, () => {
	it("토큰이 없으면 요청하지 않고 missing", async () => {
		const fake = recordingFetch([]);
		await expect(
			verifyTurnstile("s", undefined, "ip", fake.impl),
		).resolves.toBe("missing");
		expect(fake.calls).toHaveLength(0);
	});

	it("검증 결과를 그대로 돌려준다", async () => {
		const passed = recordingFetch([Response.json({ success: true })]);
		await expect(verifyTurnstile("s", "t", "ip", passed.impl)).resolves.toBe(
			"passed",
		);
		const body = passed.calls[0]?.init.body;
		expect(body instanceof URLSearchParams && body.get("remoteip")).toBe("ip");
		const rejected = recordingFetch([Response.json({ success: false })]);
		await expect(verifyTurnstile("s", "t", "ip", rejected.impl)).resolves.toBe(
			"rejected",
		);
	});

	it("검증 서버 장애는 unavailable (통과로 보지 않는다)", async () => {
		const fake = recordingFetch([new Response("down", { status: 503 })]);
		await expect(verifyTurnstile("s", "t", "ip", fake.impl)).resolves.toBe(
			"unavailable",
		);
	});
});
