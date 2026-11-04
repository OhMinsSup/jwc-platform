import { recordingFetch, rejectionOf } from "@jwc/common/testing";
import { buildCsp } from "@jwc/security/headers";
import { judgeRequest } from "@jwc/security/request-policy";
import { describe, expect, it } from "vite-plus/test";

import { DomainError } from "../src/platform/server/errors/domain-error";
import {
	cspDirectives,
	requestPolicy,
} from "../src/platform/server/security/policy";
import { assertHuman } from "../src/platform/server/security/turnstile";

const SITE = "https://forms.example.org";
const POLICY = requestPolicy(SITE);

function post(path: string): Request {
	return new Request(`${SITE}${path}`, {
		method: "POST",
		headers: { origin: SITE },
	});
}

describe("앱 요청 정책", () => {
	it("Better Auth 공개 가입 엔드포인트는 막는다 (초대 코드 서버 함수로만 가입)", () => {
		expect(judgeRequest(post("/api/auth/sign-up/email"), POLICY)).toMatchObject(
			{
				kind: "reject",
				status: 403,
			},
		);
	});

	it("로그인은 admin_auth 규칙으로 속도 제한한다", () => {
		expect(judgeRequest(post("/api/auth/sign-in/email"), POLICY)).toStrictEqual(
			{
				kind: "rate_limit",
				rule: "admin_auth",
			},
		);
	});

	it("서버 함수는 같은 출처면 통과", () => {
		expect(judgeRequest(post("/_serverFn/abc"), POLICY)).toStrictEqual({
			kind: "allow",
		});
	});
});

describe("앱 CSP", () => {
	it("기본: eval 없음, 프레임 삽입/플러그인 금지, 외부 연결은 자기 출처만", () => {
		const csp = buildCsp(
			cspDirectives({ dev: false, posthogHost: null, turnstile: false }),
		);
		expect(csp).not.toContain("unsafe-eval");
		expect(csp).toContain("frame-ancestors 'none'");
		expect(csp).toContain("object-src 'none'");
		expect(csp).toContain("connect-src 'self'; ");
		expect(csp).toContain("frame-src 'none'");
	});

	it("PostHog/Turnstile을 켜면 그 출처만 더한다", () => {
		const csp = buildCsp(
			cspDirectives({
				dev: false,
				posthogHost: "https://us.i.posthog.com",
				turnstile: true,
			}),
		);
		expect(csp).toContain(
			"connect-src 'self' https://us.i.posthog.com https://us-assets.i.posthog.com",
		);
		expect(csp).toContain("frame-src https://challenges.cloudflare.com");
	});
});

describe(assertHuman, () => {
	const config = { siteKey: "site", secretKey: "secret" };

	it("설정이 없으면 검사하지 않는다", async () => {
		await expect(assertHuman(null, undefined, "ip")).resolves.toBeUndefined();
	});

	it("토큰이 없거나 실패면 bot_check_failed, 검증 서버 장애는 upstream_unavailable", async () => {
		const missing = await rejectionOf(
			assertHuman(config, undefined, "ip"),
			DomainError,
		);
		expect(missing.code).toBe("bot_check_failed");
		const down = await rejectionOf(
			assertHuman(
				config,
				"t",
				"ip",
				recordingFetch([new Response("x", { status: 503 })]).impl,
			),
			DomainError,
		);
		expect(down.code).toBe("upstream_unavailable");
	});
});
