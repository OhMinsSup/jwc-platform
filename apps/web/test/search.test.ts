import { describe, expect, it } from "vite-plus/test";

import {
	CRAWLER_DISALLOWED_PATHS,
	llmsTxt,
	robotsTxt,
	sitemapXml,
} from "../src/platform/crawler-files";
import {
	absoluteUrl,
	formPath,
	INDEXABLE_ROBOTS,
	indexableHead,
	siteOriginFrom,
} from "../src/platform/search";
import { PRIVATE_PATHS } from "../src/platform/server/security/policy";
import {
	formStructuredData,
	homeStructuredData,
	jsonLdScript,
} from "../src/platform/structured-data";

const ORIGIN = "https://forms.example.org";
const RETREAT = {
	slug: "retreat",
	title: "여름 수련회",
	description: "7월 수련회\n신청",
};
const FORMS = [
	RETREAT,
	{ slug: "camp", title: "캠프 [마감 임박]", description: "" },
];

describe(absoluteUrl, () => {
	it("질의 문자열과 조각을 버린 절대 주소를 만든다 (canonical에 토큰이 섞이지 않게)", () => {
		expect(absoluteUrl(ORIGIN, "/f/retreat?step=review#top")).toBe(
			`${ORIGIN}/f/retreat`,
		);
	});
});

describe(formPath, () => {
	it("slug를 경로 조각으로 인코딩한다", () => {
		expect(formPath("a b/c")).toBe("/f/a%20b%2Fc");
	});
});

describe(siteOriginFrom, () => {
	it("root 로더의 siteOrigin을 읽는다", () => {
		expect(siteOriginFrom([{ loaderData: { siteOrigin: ORIGIN } }])).toBe(
			ORIGIN,
		);
	});

	it.each([
		[[]],
		[[{}]],
		[[{ loaderData: null }]],
		[[{ loaderData: { siteOrigin: 1 } }]],
		[[{ loaderData: { siteOrigin: "" } }]],
	])("root 데이터가 없거나 모양이 다르면 undefined: %j", (matches) => {
		expect(siteOriginFrom(matches)).toBeUndefined();
	});
});

describe(indexableHead, () => {
	it("index robots, og:url, canonical을 같은 절대 주소로 선언한다", () => {
		const head = indexableHead(ORIGIN, "/f/retreat");
		expect(head.meta).toStrictEqual([
			{ name: "robots", content: INDEXABLE_ROBOTS },
			{ property: "og:url", content: `${ORIGIN}/f/retreat` },
		]);
		expect(head.links).toStrictEqual([
			{ rel: "canonical", href: `${ORIGIN}/f/retreat` },
		]);
	});

	it("출처를 모르면 아무것도 선언하지 않아 root의 noindex가 남는다", () => {
		expect(indexableHead(undefined, "/")).toStrictEqual({
			meta: [],
			links: [],
		});
	});
});

describe(homeStructuredData, () => {
	it("WebSite와 접수 중인 신청서 목록(ItemList)을 화면 순서대로 담는다", () => {
		const data = homeStructuredData(
			ORIGIN,
			{ title: "신청서 목록", description: "설명" },
			FORMS,
		);
		expect(data).toMatchObject({
			"@context": "https://schema.org",
			"@graph": [
				{ "@type": "WebSite", url: `${ORIGIN}/`, name: "Formpass" },
				{
					"@type": "CollectionPage",
					url: `${ORIGIN}/`,
					mainEntity: {
						"@type": "ItemList",
						numberOfItems: 2,
						itemListElement: [
							{ position: 1, url: `${ORIGIN}/f/retreat`, name: "여름 수련회" },
							{ position: 2, url: `${ORIGIN}/f/camp` },
						],
					},
				},
			],
		});
	});
});

describe(formStructuredData, () => {
	it("WebPage와 홈 → 폼 BreadcrumbList를 담고 설명은 한 줄로 정리한다", () => {
		const data = formStructuredData(ORIGIN, RETREAT);
		expect(data).toMatchObject({
			"@graph": [
				{ "@type": "WebSite" },
				{
					"@type": "WebPage",
					url: `${ORIGIN}/f/retreat`,
					name: "여름 수련회",
					description: "7월 수련회 신청",
				},
				{
					"@type": "BreadcrumbList",
					itemListElement: [
						{ position: 1, item: `${ORIGIN}/` },
						{ position: 2, item: `${ORIGIN}/f/retreat` },
					],
				},
			],
		});
	});

	it("설명이 비면 description 속성을 두지 않는다", () => {
		const data = formStructuredData(ORIGIN, {
			slug: "camp",
			title: "캠프",
			description: " \n ",
		});
		expect(data).toMatchObject({
			"@graph": [{ "@type": "WebSite" }, { "@type": "WebPage" }, {}],
		});
		// description은 WebSite(사이트 소개) 하나에만 남는다
		expect(JSON.stringify(data).split('"description"')).toHaveLength(2);
	});
});

describe(jsonLdScript, () => {
	it("운영자가 입력한 </script>로 태그를 닫지 못하게 인코딩하고 JSON 값은 그대로 둔다", () => {
		const data = { name: "</script><script>alert(1)</script> & \u2028" };
		const script = jsonLdScript(data);
		expect(script.type).toBe("application/ld+json");
		expect(script.children).not.toMatch(/[<>&\u2028]/u);
		expect(JSON.parse(script.children)).toStrictEqual(data);
	});
});

describe(robotsTxt, () => {
	const text = robotsTxt(ORIGIN);

	it("모든 수집기에 공개 화면을 열고 사이트맵 절대 주소를 알린다", () => {
		expect(text).toContain("User-agent: *\nAllow: /\n");
		expect(text).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);
	});

	it("개인정보 화면(PRIVATE_PATHS)은 모두 막는다", () => {
		const disallowed = [...text.matchAll(/^Disallow: (?<path>.+)$/gmu)].map(
			(match) => match.groups?.path ?? "",
		);
		expect(disallowed).toStrictEqual([...CRAWLER_DISALLOWED_PATHS]);
		for (const privatePath of PRIVATE_PATHS) {
			expect(disallowed.some((path) => privatePath.test(path))).toBe(true);
		}
	});
});

describe(sitemapXml, () => {
	it("홈과 접수 중인 공개 폼의 주소를 담는다", () => {
		const xml = sitemapXml(ORIGIN, FORMS);
		expect(
			[...xml.matchAll(/<loc>(?<url>[^<]+)<\/loc>/gu)].map(
				(m) => m.groups?.url,
			),
		).toStrictEqual([`${ORIGIN}/`, `${ORIGIN}/f/retreat`, `${ORIGIN}/f/camp`]);
	});

	it("주소의 XML 특수 문자를 이스케이프한다", () => {
		const xml = sitemapXml("https://x.test", [
			{ slug: "a&b", title: "t", description: "" },
		]);
		expect(xml).toContain("<loc>https://x.test/f/a%26b</loc>");
		expect(xml).not.toMatch(/<loc>[^<]*&(?!amp;)[^<]*<\/loc>/u);
	});
});

describe(llmsTxt, () => {
	it("서비스 요약과 접수 중인 신청서 링크를 Markdown으로 쓴다", () => {
		const text = llmsTxt(ORIGIN, FORMS);
		expect(text.startsWith("# Formpass\n\n> ")).toBe(true);
		expect(text).toContain(
			`- [여름 수련회](${ORIGIN}/f/retreat): 7월 수련회 신청`,
		);
		// 링크 문법을 깨는 대괄호는 이스케이프하고, 빈 설명은 콜론 없이 링크만 둔다
		expect(text).toContain(`- [캠프 \\[마감 임박\\]](${ORIGIN}/f/camp)\n`);
	});

	it("접수 중인 신청서가 없으면 그렇다고 적는다", () => {
		expect(llmsTxt(ORIGIN, [])).toContain(
			"- 지금 접수 중인 신청서가 없습니다.",
		);
	});
});
