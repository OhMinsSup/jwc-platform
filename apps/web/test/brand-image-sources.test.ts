import { readFileSync } from "node:fs";

import { describe, expect, it } from "vite-plus/test";

import {
	FAVICON_VARIANT,
	iconSvg,
	ogImageHtml,
	packIco,
} from "../scripts/brand-image-sources";

const favicon = readFileSync(
	new URL("../public/favicon.svg", import.meta.url),
	"utf-8",
);

describe(iconSvg, () => {
	it("다크 규칙을 빼고 반경·배율·크기를 바꾼다", () => {
		const svg = iconSvg(favicon, { size: 180, radius: 0, scale: 1.05 });
		expect(svg).not.toContain("prefers-color-scheme");
		expect(svg).toContain('rx="0"');
		expect(svg).toContain("scale(1.05)");
		expect(svg).toContain('width="180" height="180"');
	});

	it("원본 값이 예상과 다르면 틀린 아이콘을 만들지 않고 실패한다", () => {
		expect(() =>
			iconSvg(favicon.replace('rx="8"', 'rx="6"'), {
				size: 32,
				radius: 8,
				scale: 1.25,
			}),
		).toThrow("favicon.svg의 rx 또는 scale 값이 예상과 다릅니다");
	});

	it("원본 svg 태그에 크기가 이미 있으면 속성이 겹치지 않게 실패한다", () => {
		expect(() =>
			iconSvg(favicon.replace("<svg ", '<svg width="32" height="32" '), {
				size: 64,
				...FAVICON_VARIANT,
			}),
		).toThrow("favicon.svg의 svg 태그에 width/height를 두지 않습니다");
	});
});

describe(packIco, () => {
	it("PNG 개수·크기·위치를 ICO 머리에 적고 PNG를 그대로 이어 붙인다", () => {
		const first = new Uint8Array([1, 2, 3]);
		const second = new Uint8Array([4, 5]);
		const ico = packIco([
			{ size: 16, png: first },
			{ size: 256, png: second },
		]);
		const view = new DataView(ico.buffer);
		// 256px은 ICO 형식상 0으로 적는다
		expect({
			type: view.getUint16(2, true),
			count: view.getUint16(4, true),
			widths: [ico[6], ico[22]],
			offsets: [view.getUint32(18, true), view.getUint32(34, true)],
		}).toStrictEqual({ type: 1, count: 2, widths: [16, 0], offsets: [38, 41] });
		expect([...ico.subarray(38)]).toStrictEqual([1, 2, 3, 4, 5]);
	});
});

describe(ogImageHtml, () => {
	it("문구를 HTML로 인코딩해 문서에 넣는다", () => {
		const html = ogImageHtml(
			{ name: "A<b>", tagline: "x & y", description: '"q"' },
			"<svg></svg>",
			"",
		);
		expect(html).toContain("A&lt;b&gt;");
		expect(html).toContain("x &amp; y");
		expect(html).toContain("&quot;q&quot;");
	});
});
