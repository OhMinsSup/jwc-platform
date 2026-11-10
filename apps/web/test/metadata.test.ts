import { describe, expect, it } from "vite-plus/test";

import { BRAND_DESCRIPTION } from "../src/platform/brand";
import { pageMeta, shareCardMeta } from "../src/platform/metadata";

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

	it("카드 종류는 이미지와 함께 정하도록 남겨 둔다 (하위 화면이 root의 카드를 덮지 않게)", () => {
		const meta = pageMeta({ title: "신청" });
		expect(meta.some((m) => "name" in m && m.name === "twitter:card")).toBe(
			false,
		);
	});
});

describe(shareCardMeta, () => {
	const ORIGIN = "https://forms.example.org";
	const IMAGE = `${ORIGIN}/og-image.png`;

	it("사이트 출처로 이미지의 절대 주소를 만들고 큰 이미지 카드로 선언한다", () => {
		const meta = shareCardMeta(ORIGIN);
		expect(meta).toContainEqual({ property: "og:image", content: IMAGE });
		expect(meta).toContainEqual({ name: "twitter:image", content: IMAGE });
		expect(meta).toContainEqual({
			name: "twitter:card",
			content: "summary_large_image",
		});
	});

	it("이미지 크기를 함께 알린다", () => {
		const meta = shareCardMeta(ORIGIN);
		expect(meta).toContainEqual({
			property: "og:image:width",
			content: "1200",
		});
		expect(meta).toContainEqual({
			property: "og:image:height",
			content: "630",
		});
	});

	it.each([undefined, ""])(
		"출처를 모르면(로더 실패) 이미지 없이 기본 카드만 선언한다: %s",
		(origin) => {
			expect(shareCardMeta(origin)).toStrictEqual([
				{ name: "twitter:card", content: "summary" },
			]);
		},
	);
});
