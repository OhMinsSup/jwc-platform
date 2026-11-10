import { BRAND_DESCRIPTION, BRAND_NAME } from "./brand";
import { absoluteUrl, formPath, HOME_PATH } from "./search";
import type { ListedForm } from "./structured-data";

/**
 * 수집기용 텍스트 파일 (ADR-0023). 사이트 출처가 환경마다 달라 정적 파일 대신 요청 때 만든다.
 * - robots.txt: 모든 수집기(검색·AI·링크 미리보기)에 공개 화면을 열고 개인정보 화면은 막는다
 * - sitemap.xml: 홈 + 접수 중인 공개 폼
 * - llms.txt: AI 수집기가 읽는 사이트 요약 (https://llmstxt.org 형식)
 */

/**
 * 수집기에 막는 경로. 개인정보 화면(PRIVATE_PATHS: /r/, /admin)과 서버 엔드포인트.
 * 신청 완료(/f/<slug>/done)는 robots로 막지 않고 noindex 메타로 뺀다 (막으면 noindex를 읽지 못한다).
 */
export const CRAWLER_DISALLOWED_PATHS = [
	"/r/",
	"/admin",
	"/api/",
	"/_serverFn/",
] as const;

/** 수집기 응답 캐시 (공개 폼 목록이 바뀌어도 한 시간 안에 반영) */
export const CRAWLER_FILE_CACHE_CONTROL = "public, max-age=3600";

export function robotsTxt(origin: string): string {
	return [
		"# 검색·AI·링크 미리보기 수집기 모두 같은 규칙을 따른다 (ADR-0023)",
		"# 노출 여부는 화면별 robots 메타가 정한다: 홈·접수 중인 공개 폼만 index",
		"User-agent: *",
		"Allow: /",
		...CRAWLER_DISALLOWED_PATHS.map((path) => `Disallow: ${path}`),
		"",
		`Sitemap: ${absoluteUrl(origin, "/sitemap.xml")}`,
		"",
	].join("\n");
}

const XML_ESCAPES: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&apos;",
};

function escapeXml(text: string): string {
	return text.replaceAll(/[&<>"']/gu, (char) => XML_ESCAPES[char] ?? char);
}

function indexedPaths(forms: readonly ListedForm[]): string[] {
	return [HOME_PATH, ...forms.map((form) => formPath(form.slug))];
}

export function sitemapXml(
	origin: string,
	forms: readonly ListedForm[],
): string {
	const urls = indexedPaths(forms).map(
		(path) => `  <url><loc>${escapeXml(absoluteUrl(origin, path))}</loc></url>`,
	);
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		...urls,
		"</urlset>",
		"",
	].join("\n");
}

/** Markdown 한 줄로: 줄바꿈을 공백으로, 링크 문법을 깨는 대괄호를 이스케이프 */
function markdownInline(text: string): string {
	return text
		.replaceAll(/\s+/gu, " ")
		.trim()
		.replaceAll(/[[\]]/gu, (char) => `\\${char}`);
}

function formLine(origin: string, form: ListedForm): string {
	const link = `- [${markdownInline(form.title)}](${absoluteUrl(origin, formPath(form.slug))})`;
	const description = markdownInline(form.description);
	return description.length > 0 ? `${link}: ${description}` : link;
}

export function llmsTxt(origin: string, forms: readonly ListedForm[]): string {
	const list =
		forms.length > 0
			? forms.map((form) => formLine(origin, form))
			: ["- 지금 접수 중인 신청서가 없습니다."];
	return [
		`# ${BRAND_NAME}`,
		"",
		`> ${BRAND_DESCRIPTION}`,
		"",
		"신청서를 골라 신청하면 신청 내역과 안내를 문자로 보내드립니다. 신청 내역과 관리자 화면은 공개하지 않습니다.",
		"",
		"## 접수 중인 신청서",
		"",
		...list,
		"",
		"## 둘러보기",
		"",
		`- [신청서 목록](${absoluteUrl(origin, HOME_PATH)}): 지금 접수 중인 신청서 전체`,
		"",
	].join("\n");
}
