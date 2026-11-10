import { describe, expect, it } from "vite-plus/test";

import { BRAND_DESCRIPTION } from "../src/platform/brand";
import { pageMeta, shareImageMeta } from "../src/platform/metadata";

describe(pageMeta, () => {
	it("페이지 제목과 일반·공유 설명을 같은 값으로 만든다", () => {
		const meta = pageMeta({
			title: "수련회 신청",
			description: "  신청\n 안내\t입니다.  ",
		});
		expect(meta).toContainEqual({ title: "수련회 신청 | Formpass" });
		for (const name of ["description", "twitter:description"]) {
			expect(meta).toContainEqual({ name, content: "신청 안내 입니다." });
		}
		expect(meta).toContainEqual({
			property: "og:description",
			content: "신청 안내 입니다.",
		});
	});

	it.each([undefined, "", "\n\t "])(
		"설명이 비어 있으면 사이트 설명을 사용한다: %s",
		(description) => {
			expect(pageMeta({ title: "신청", description })).toContainEqual({
				name: "description",
				content: BRAND_DESCRIPTION,
			});
		},
	);

	it("긴 설명은 이모지·조합 문자를 끊지 않고 160글자로 제한한다", () => {
		const emoji = "👨‍👩‍👧‍👦";
		const meta = pageMeta({ title: "신청", description: emoji.repeat(161) });
		expect(meta).toContainEqual({
			name: "description",
			content: emoji.repeat(160),
		});
	});

	it("공유 미리보기는 큰 이미지 카드로 보인다", () => {
		expect(pageMeta({ title: "신청" })).toContainEqual({
			name: "twitter:card",
			content: "summary_large_image",
		});
	});
});

describe(shareImageMeta, () => {
	it("메신저가 읽을 수 있게 사이트 출처로 절대 주소를 만든다", () => {
		const meta = shareImageMeta("https://forms.example.org");
		for (const key of ["og:image", "twitter:image"]) {
			expect(meta).toContainEqual(
				expect.objectContaining({
					content: "https://forms.example.org/og-image.png",
				}),
			);
			expect(
				meta.some((m) => ("property" in m ? m.property : m.name) === key),
			).toBe(true);
		}
		expect(meta).toContainEqual({
			property: "og:image:width",
			content: "1200",
		});
		expect(meta).toContainEqual({
			property: "og:image:height",
			content: "630",
		});
	});

	it.each(["", "not a url", "ftp://files.example.org"])(
		"출처가 http(s) 주소가 아니면 이미지 메타를 만들지 않는다: %s",
		(origin) => {
			expect(shareImageMeta(origin)).toStrictEqual([]);
		},
	);
});
