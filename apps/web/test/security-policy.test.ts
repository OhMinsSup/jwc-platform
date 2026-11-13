import { recordingFetch, rejectionOf } from "@jwc/common/testing";
import { buildCsp, privacyHeaders } from "@jwc/security/headers";
import { judgeRequest } from "@jwc/security/request-policy";
import { describe, expect, it } from "vite-plus/test";

import { DomainError } from "../src/platform/server/errors/domain-error";
import {
	cspDirectives,
	PRIVATE_PATHS,
	requestPolicy,
} from "../src/platform/server/security/policy";
import { assertHuman } from "../src/platform/server/security/turnstile";

const SITE = "https://forms.example.org";
const POLICY = requestPolicy(SITE);

describe("개인정보 응답 보호", () => {
	it.each([
		"/r/private-token",
		"/admin/forms",
		"/f/retreat/done",
		"/_serverFn/private-function",
		"/api/auth/get-session",
	])("개인정보 경로 %s는 캐시와 리퍼러 전송을 막는다", (pathname) => {
		expect(privacyHeaders(pathname, PRIVATE_PATHS)).toMatchObject({
			"cache-control": "no-store",
			"referrer-policy": "no-referrer",
			"x-robots-tag": "noindex, nofollow",
		});
	});

	it("공개 폼 HTML의 캐시 정책을 강제하지 않는다", () => {
		expect(privacyHeaders("/f/retreat", PRIVATE_PATHS)).toStrictEqual({});
	});
});

function post(path: string): Request {
	return new Request(`${SITE}${path}`, {
		method: "POST",
		headers: { origin: SITE },
	});
}

describe("앱 요청 정책", () => {
	it.each([
		"/api/auth/send-verification-email",
		"/api/auth/request-password-reset",
		"/api/auth/phone-number/verify",
		"/api/auth/sign-in/phone-number",
	])("사용하지 않는 공개 인증 경로는 차단한다: %s", (path) => {
		expect(judgeRequest(post(path), POLICY)).toMatchObject({
			kind: "reject",
			status: 403,
		});
	});

	it("2단계 인증도 영속 속도 제한한다", () => {
		expect(
			judgeRequest(post("/api/auth/two-factor/verify-totp"), POLICY),
		).toStrictEqual({ kind: "rate_limit", rule: "admin_two_factor" });
	});

	it("2단계 인증 해제는 HTTP 경계에서도 거절한다", () => {
		expect(
			judgeRequest(post("/api/auth/two-factor/disable"), POLICY),
		).toMatchObject({ kind: "reject", status: 403 });
	});

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
	it("기본: eval 없음, 프레임 삽입/플러그인 금지", () => {
		const csp = buildCsp(
			cspDirectives({ dev: false, posthogHost: null, turnstile: false }),
		);
		expect(csp).not.toContain("unsafe-eval");
		expect(csp).toContain("frame-ancestors 'none'");
		expect(csp).toContain("object-src 'none'");
		expect(csp).toContain("frame-src 'none'");
	});

	it("PostHog 키가 없는 환경에서도 PostHog 두 출처는 연다", () => {
		const csp = buildCsp(
			cspDirectives({ dev: false, posthogHost: null, turnstile: false }),
		);
		// 환경마다 키 설정이 달라도 PostHog 요청이 CSP에 막히지 않게 두 출처는 항상 연다
		expect(csp).toContain(
			"connect-src 'self' https://us.i.posthog.com https://us-assets.i.posthog.com; ",
		);
		expect(csp).toContain(
			"script-src 'self' 'unsafe-inline' https://us.i.posthog.com https://us-assets.i.posthog.com; ",
		);
	});

	it("다른 PostHog 수집 주소를 쓰면 기본 두 출처에 더한다 (중복 없이)", () => {
		const csp = buildCsp(
			cspDirectives({
				dev: false,
				posthogHost: "https://eu.i.posthog.com",
				turnstile: false,
			}),
		);
		expect(csp).toContain(
			"connect-src 'self' https://us.i.posthog.com https://us-assets.i.posthog.com https://eu.i.posthog.com https://eu-assets.i.posthog.com; ",
		);
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
