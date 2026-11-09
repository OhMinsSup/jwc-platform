import { describe, expect, it } from "vite-plus/test";

import { pageMeta } from "../src/platform/metadata";

describe(pageMeta, () => {
	it("페이지 제목과 일반·공유 설명을 같은 값으로 만든다", () => {
		const meta = pageMeta({
			title: "수련회 신청",
			description: "  신청\n 안내\t입니다.  ",
		});
		expect(meta).toContainEqual({ title: "수련회 신청 | JWC 청년부" });
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
				content: "죽전우리교회 청년부 행사 신청과 안내를 확인하세요.",
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
});
