import { BRAND_DESCRIPTION, BRAND_NAME } from "./brand";
import { absoluteUrl, formPath, HOME_PATH } from "./search";

/**
 * 화면 구성에 맞춘 schema.org 구조화 데이터 (JSON-LD, ADR-0023).
 * - 홈: WebSite + CollectionPage(접수 중인 신청서 ItemList)
 * - 공개 폼: WebSite + WebPage + BreadcrumbList(홈 → 폼)
 * 화면에 보이는 값만 넣는다 (일정·주최처럼 화면에 없는 사실을 만들지 않는다).
 * head()의 scripts로 넣고, 본문은 jsonLdScript가 HTML 안전하게 인코딩한다.
 */

const SCHEMA_CONTEXT = "https://schema.org";
const LANGUAGE = "ko-KR";

type JsonLd = Record<string, unknown>;

/**
 * script 본문에서 HTML로 해석될 수 있는 문자. 폼 제목·설명은 운영자가 입력한 값이라
 * "</script>"가 들어 있어도 태그를 닫지 못하게 JSON 유니코드 이스케이프로 바꾼다 (JSON 값은 그대로).
 */
const SCRIPT_UNSAFE = /[<>&\u2028\u2029]/gu;

function escapeForScript(char: string): string {
	return `\\u${char.codePointAt(0)?.toString(16).padStart(4, "0") ?? ""}`;
}

/** head()의 scripts 항목: <script type="application/ld+json">본문</script> */
export function jsonLdScript(data: JsonLd) {
	return {
		type: "application/ld+json",
		children: JSON.stringify(data).replaceAll(SCRIPT_UNSAFE, escapeForScript),
	};
}

export interface ListedForm {
	description: string;
	slug: string;
	title: string;
}

function websiteId(origin: string): string {
	return `${absoluteUrl(origin, HOME_PATH)}#website`;
}

function websiteNode(origin: string): JsonLd {
	return {
		"@type": "WebSite",
		"@id": websiteId(origin),
		url: absoluteUrl(origin, HOME_PATH),
		name: BRAND_NAME,
		description: BRAND_DESCRIPTION,
		inLanguage: LANGUAGE,
	};
}

/** 빈 설명은 속성을 두지 않는다 (빈 문자열 description은 검사 도구가 경고한다) */
function withDescription(node: JsonLd, description: string | undefined) {
	const text = description?.replaceAll(/\s+/gu, " ").trim() ?? "";
	return text.length > 0 ? { ...node, description: text } : node;
}

export function homeStructuredData(
	origin: string,
	page: { title: string; description: string },
	forms: readonly ListedForm[],
): JsonLd {
	const url = absoluteUrl(origin, HOME_PATH);
	return {
		"@context": SCHEMA_CONTEXT,
		"@graph": [
			websiteNode(origin),
			{
				"@type": "CollectionPage",
				"@id": url,
				url,
				name: page.title,
				description: page.description,
				inLanguage: LANGUAGE,
				isPartOf: { "@id": websiteId(origin) },
				mainEntity: {
					"@type": "ItemList",
					numberOfItems: forms.length,
					itemListElement: forms.map((form, index) => ({
						"@type": "ListItem",
						position: index + 1,
						url: absoluteUrl(origin, formPath(form.slug)),
						name: form.title,
					})),
				},
			},
		],
	};
}

export function formStructuredData(origin: string, form: ListedForm): JsonLd {
	const url = absoluteUrl(origin, formPath(form.slug));
	return {
		"@context": SCHEMA_CONTEXT,
		"@graph": [
			websiteNode(origin),
			withDescription(
				{
					"@type": "WebPage",
					"@id": url,
					url,
					name: form.title,
					inLanguage: LANGUAGE,
					isPartOf: { "@id": websiteId(origin) },
					breadcrumb: { "@id": `${url}#breadcrumb` },
				},
				form.description,
			),
			{
				"@type": "BreadcrumbList",
				"@id": `${url}#breadcrumb`,
				itemListElement: [
					{
						"@type": "ListItem",
						position: 1,
						name: BRAND_NAME,
						item: absoluteUrl(origin, HOME_PATH),
					},
					{ "@type": "ListItem", position: 2, name: form.title, item: url },
				],
			},
		],
	};
}
