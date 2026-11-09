import type { CspDirectives } from "@jwc/security/headers";
import type { RequestPolicy } from "@jwc/security/request-policy";

/**
 * 이 앱의 보안 정책 (데이터). 판정/헤더 생성은 @jwc/security가 하고, 여기서는 무엇을 허용할지만 정한다.
 */

const MINUTE_MS = 60_000;

/**
 * 요청 수 제한 규칙. 대상(subject)은 IP 등이고 원문 대신 HMAC으로 저장한다.
 * - submit: 폼 + IP당. 정상 사용(수정 재제출 포함)보다 넉넉하게, 자동 제출 공격은 막는다
 * - submission_view: 신청 내역 링크 추측 시도 방지 (IP당)
 * - admin_auth: 로그인/가입 무차별 대입 방지 (IP당)
 */
export const RATE_LIMITS = {
	submit: { max: 10, windowMs: 10 * MINUTE_MS },
	submission_view: { max: 60, windowMs: 10 * MINUTE_MS },
	admin_auth: { max: 10, windowMs: 10 * MINUTE_MS },
	admin_two_factor: { max: 10, windowMs: 10 * MINUTE_MS },
	admin_sms: { max: 3, windowMs: 10 * MINUTE_MS },
	admin_sms_verify: { max: 10, windowMs: 10 * MINUTE_MS },
} as const;

export type RateLimitRule = keyof typeof RATE_LIMITS;

/** 서버 함수/API 요청 본문 상한 (초안 JSON 최대 500KB + 여유) */
const MAX_BODY_BYTES = 1_048_576;

/**
 * 요청 판정 정책. 관리자 가입은 초대 코드를 검사하는 서버 함수로만 한다
 * (Better Auth의 공개 가입 엔드포인트는 막고, 로그인은 속도 제한).
 */
const AUTH_RULES: RequestPolicy<RateLimitRule>["rules"] = [
	{
		prefix: "/api/auth/two-factor/disable",
		action: {
			kind: "reject",
			status: 403,
			message: "관리자 2단계 인증은 해제할 수 없습니다",
		},
	},
	{
		prefix: "/api/auth/two-factor/",
		action: { kind: "rate_limit", rule: "admin_two_factor" },
	},
	{
		prefix: "/api/auth/phone-number/",
		action: {
			kind: "reject",
			status: 403,
			message: "관리자 인증 화면을 이용해주세요",
		},
	},
	{
		prefix: "/api/auth/sign-in/phone-number",
		action: {
			kind: "reject",
			status: 403,
			message: "관리자 로그인 화면을 이용해주세요",
		},
	},
	{
		prefix: "/api/auth/send-verification-email",
		action: {
			kind: "reject",
			status: 403,
			message: "SMS 인증을 이용해주세요",
		},
	},
	{
		prefix: "/api/auth/request-password-reset",
		action: {
			kind: "reject",
			status: 403,
			message: "SMS 인증을 이용해주세요",
		},
	},
	{
		prefix: "/api/auth/reset-password",
		action: {
			kind: "reject",
			status: 403,
			message: "SMS 인증을 이용해주세요",
		},
	},
	{
		prefix: "/api/auth/sign-up/",
		action: {
			kind: "reject",
			status: 403,
			message: "관리자 가입 화면을 이용해주세요",
		},
	},
	{
		prefix: "/api/auth/sign-in/",
		action: { kind: "rate_limit", rule: "admin_auth" },
	},
];

export function requestPolicy(
	siteOrigin: string,
): RequestPolicy<RateLimitRule> {
	return {
		siteOrigin,
		guardedPrefixes: ["/_serverFn/", "/api/"],
		maxBodyBytes: MAX_BODY_BYTES,
		rules: AUTH_RULES,
	};
}

export interface CspSources {
	/** 개발 서버(HMR 웹소켓)면 true */
	dev: boolean;
	/** PostHog 수집 주소 (없으면 null) */
	posthogHost: string | null;
	/** Turnstile 사용 여부 */
	turnstile: boolean;
}

const FONT_CDN = "https://cdn.jsdelivr.net";
const TURNSTILE = "https://challenges.cloudflare.com";

/**
 * 항상 여는 PostHog 출처(US 수집 + 리플레이/설정 스크립트).
 * 환경마다 키·주소 설정이 달라도 분석 요청이 CSP에 막히지 않게 고정으로 둔다.
 */
const POSTHOG_ORIGINS = [
	"https://us.i.posthog.com",
	"https://us-assets.i.posthog.com",
] as const;

/** us.i.posthog.com → us-assets.i.posthog.com (리플레이/설정 스크립트를 내려받는 주소) */
function posthogAssetHost(host: string): string {
	return host.replace(".i.posthog.com", "-assets.i.posthog.com");
}

/** 고정 출처 + 설정된 수집 주소(다르면)와 그 asset 주소, 중복 없이 */
function posthogOrigins(host: string | null): string[] {
	const configured = host === null ? [] : [host, posthogAssetHost(host)];
	return [...new Set([...POSTHOG_ORIGINS, ...configured])];
}

/**
 * CSP 지시어 표. script-src는 SSR 하이드레이션 인라인 스크립트 때문에 'unsafe-inline'을 둔다(nonce 전환은 ADR-0006 후속).
 * 대신 eval 금지, 외부 출처는 목록으로 제한, 프레임 삽입/플러그인/base 변경/외부 form 전송을 막는다.
 */
export function cspDirectives(sources: CspSources): CspDirectives {
	const posthog = posthogOrigins(sources.posthogHost);
	const turnstile = sources.turnstile ? [TURNSTILE] : [];
	return {
		"default-src": ["'self'"],
		"script-src": ["'self'", "'unsafe-inline'", ...posthog, ...turnstile],
		"style-src": ["'self'", "'unsafe-inline'", FONT_CDN],
		"font-src": ["'self'", FONT_CDN, "data:"],
		"img-src": ["'self'", "data:", "blob:", ...posthog],
		"connect-src": [
			"'self'",
			...posthog,
			...(sources.dev ? ["ws:", "wss:"] : []),
		],
		"frame-src": turnstile,
		// PostHog 세션 리플레이 압축 워커
		"worker-src": ["'self'", "blob:"],
		"object-src": [],
		"base-uri": ["'self'"],
		"form-action": ["'self'"],
		"frame-ancestors": [],
	};
}

/** 개인정보가 보이는 화면 (no-store, noindex) */
export const PRIVATE_PATHS: readonly RegExp[] = [
	/^\/r\//u,
	/^\/admin(?:\/|$)/u,
];
