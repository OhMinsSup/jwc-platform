/**
 * 검색·AI 수집기 노출 정책 (ADR-0023). 기본은 비노출이고, 홈과 접수 중인 공개 폼만 노출한다.
 * 신청 완료·신청 내역·관리자 화면은 root의 기본값(noindex)을 그대로 따른다.
 */

/** root가 모든 화면에 거는 기본값. 하위 화면이 같은 name을 선언하면 그 값이 이긴다 (HeadContent) */
export const NOINDEX_ROBOTS = "noindex, nofollow";

/** 노출하는 화면: 큰 미리보기 이미지와 제한 없는 발췌를 허용한다 */
export const INDEXABLE_ROBOTS =
	"index, follow, max-image-preview:large, max-snippet:-1";

/** 노출하는 화면의 경로 (주소의 단일 소스: canonical·sitemap·llms.txt·구조화 데이터가 같이 쓴다) */
export const HOME_PATH = "/";

export function formPath(slug: string): string {
	return `/f/${encodeURIComponent(slug)}`;
}

/** 사이트 출처 + 경로 → 절대 주소. 질의 문자열·조각은 버린다 (canonical에 토큰이 섞이지 않게) */
export function absoluteUrl(origin: string, path: string): string {
	const url = new URL(path, origin);
	url.search = "";
	url.hash = "";
	return url.href;
}

/**
 * head()의 matches에서 root 로더가 준 사이트 출처를 읽는다.
 * head의 matches 타입은 현재 라우트 기준이라 root 데이터 모양을 보장하지 않으므로 값을 검사한다.
 */
export function siteOriginFrom(
	matches: readonly { loaderData?: unknown }[],
): string | undefined {
	const data = matches[0]?.loaderData;
	if (typeof data !== "object" || data === null || !("siteOrigin" in data)) {
		return undefined;
	}
	const { siteOrigin } = data;
	return typeof siteOrigin === "string" && siteOrigin.length > 0
		? siteOrigin
		: undefined;
}

/**
 * 노출 화면의 robots·og:url 메타와 canonical 링크.
 * 출처를 모르면(root 로더 실패) 잘못된 주소를 선언하지 않도록 노출하지 않는다 (root의 noindex 유지).
 */
export function indexableHead(origin: string | undefined, path: string) {
	if (!origin) {
		return { meta: [], links: [] };
	}
	const url = absoluteUrl(origin, path);
	return {
		meta: [
			{ name: "robots", content: INDEXABLE_ROBOTS },
			{ property: "og:url", content: url },
		],
		links: [{ rel: "canonical", href: url }],
	};
}
