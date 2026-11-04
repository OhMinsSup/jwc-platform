/**
 * HTTP 요청 판정(순수 함수). 어떤 경로를 막고 어떤 경로를 속도 제한할지는 앱이 정책 표(데이터)로 넘긴다.
 */

export type PathAction<R extends string> =
	| { kind: "reject"; status: number; message: string }
	| { kind: "rate_limit"; rule: R };

export interface PathRule<R extends string> {
	action: PathAction<R>;
	/** 경로 접두사 (위에서부터 처음 맞는 규칙 하나만 적용) */
	prefix: string;
}

export interface RequestPolicy<R extends string> {
	/** 상태 변경 요청을 검사할 경로 접두사 (예: 서버 함수, API) */
	guardedPrefixes: readonly string[];
	/** 본문 상한 (Content-Length 기준) */
	maxBodyBytes: number;
	rules: readonly PathRule<R>[];
	/** 이 출처가 아닌 Origin의 상태 변경 요청은 거절한다 (CSRF) */
	siteOrigin: string;
}

export type RequestVerdict<R extends string> =
	| { kind: "allow" }
	| { kind: "reject"; status: number; message: string }
	| { kind: "rate_limit"; rule: R };

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const ALLOW = { kind: "allow" } as const;

const PAYLOAD_TOO_LARGE = 413;
const FORBIDDEN = 403;

function declaredBodySize(request: Request): number {
	const length = Number(request.headers.get("content-length") ?? "0");
	return Number.isFinite(length) ? length : 0;
}

/** Origin이 없으면 브라우저가 아닌 호출이라 쿠키 세션을 이용한 CSRF 위험이 없다 */
function isCrossSite(request: Request, siteOrigin: string): boolean {
	const origin = request.headers.get("origin");
	return origin !== null && origin !== siteOrigin;
}

/** 판정 순서: 검사 대상 여부 → 본문 크기 → 교차 출처 → 경로 규칙 */
export function judgeRequest<R extends string>(
	request: Request,
	policy: RequestPolicy<R>,
): RequestVerdict<R> {
	const { pathname } = new URL(request.url);
	const guarded = policy.guardedPrefixes.some((prefix) =>
		pathname.startsWith(prefix),
	);
	if (!guarded || SAFE_METHODS.has(request.method)) {
		return ALLOW;
	}
	if (declaredBodySize(request) > policy.maxBodyBytes) {
		return {
			kind: "reject",
			status: PAYLOAD_TOO_LARGE,
			message: "요청 본문이 너무 큽니다",
		};
	}
	if (isCrossSite(request, policy.siteOrigin)) {
		return {
			kind: "reject",
			status: FORBIDDEN,
			message: "허용되지 않은 출처입니다",
		};
	}
	const rule = policy.rules.find((candidate) =>
		pathname.startsWith(candidate.prefix),
	);
	return rule ? rule.action : ALLOW;
}
