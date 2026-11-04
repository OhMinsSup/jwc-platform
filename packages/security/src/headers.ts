/**
 * 보안 응답 헤더. CSP 지시어는 앱이 표(데이터)로 넘기고, 여기서는 문자열로 만들기만 한다.
 */

export type CspDirectives = Readonly<Record<string, readonly string[]>>;

/** 빈 값 목록은 'none'으로 바꾼다 (지시어를 빠뜨려 default-src로 넓어지는 실수 방지) */
export function buildCsp(directives: CspDirectives): string {
	return Object.entries(directives)
		.map(
			([name, values]) =>
				`${name} ${values.length > 0 ? values.join(" ") : "'none'"}`,
		)
		.join("; ");
}

/** 모든 응답에 붙이는 기본 보안 헤더 */
export function securityHeaders(csp: string): Record<string, string> {
	return {
		"content-security-policy": csp,
		"strict-transport-security": "max-age=31536000; includeSubDomains",
		"x-content-type-options": "nosniff",
		"x-frame-options": "DENY",
		// 다른 출처로는 출처만 보낸다 (주소의 비밀 경로 조각이 외부로 새지 않게)
		"referrer-policy": "strict-origin-when-cross-origin",
		"permissions-policy":
			"camera=(), microphone=(), geolocation=(), payment=()",
		"cross-origin-opener-policy": "same-origin",
	};
}

/** 개인정보가 보이는 경로: 공유 캐시에 남기지 않고 검색에 노출하지 않는다 */
export function privacyHeaders(
	pathname: string,
	privatePaths: readonly RegExp[],
): Record<string, string> {
	return privatePaths.some((pattern) => pattern.test(pathname))
		? { "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" }
		: {};
}

/** 응답 헤더를 덧붙인 새 응답 (본문 스트림은 그대로) */
export function withHeaders(
	response: Response,
	extra: Record<string, string>,
): Response {
	const headers = new Headers(response.headers);
	for (const [name, value] of Object.entries(extra)) {
		headers.set(name, value);
	}
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}
