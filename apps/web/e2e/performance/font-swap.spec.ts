import { readFileSync } from "node:fs";

import { devices, expect, test } from "@playwright/test";
import type { Locator } from "@playwright/test";

import { authenticate } from "./pages";
import { PERFORMANCE_ORIGIN } from "./settings";

const fontCss = readFileSync(
	new URL("../../src/fonts/suit.css", import.meta.url),
	"utf-8",
);
const fontUrl = /src:\s*url\("(?<url>[^"]+)"\)/u.exec(fontCss)?.groups?.url;
if (!fontUrl) {
	throw new Error("회귀 검사에 사용할 앱 글꼴 주소가 없습니다.");
}

// Linux 대체 글꼴에서 재현한 설명 폭(295px / SUIT 254px)을 모사한다.
// 앱 글꼴 자체를 재사용해 OS에 설치된 글꼴과 바이너리 fixture에 의존하지 않는다.
const FALLBACK_SIZE_ADJUST = "116%";

async function topOf(locator: Locator) {
	const box = await locator.boundingBox();
	if (!box) {
		throw new Error("요소가 표시되지 않아 위치를 측정할 수 없습니다.");
	}
	return box.y;
}

// oxlint-disable-next-line vitest/prefer-each -- Playwright는 test.each API를 제공하지 않는다.
for (const width of [375, 412, 1280]) {
	test(`관리자 목록의 글꼴 교체가 동작 버튼의 줄을 바꾸지 않는다 (${width}px)`, async ({
		browser,
	}) => {
		const context = await browser.newContext({
			...devices["Pixel 7"],
			viewport: { width, height: 915 },
			baseURL: PERFORMANCE_ORIGIN,
			locale: "ko-KR",
			timezoneId: "Asia/Seoul",
		});
		try {
			await authenticate(context, "ready");
			const page = await context.newPage();
			await page.goto("/admin", { waitUntil: "networkidle" });
			await page.addStyleTag({
				content: `@font-face { font-family: "Layout fallback"; src: url("${fontUrl}"); size-adjust: ${FALLBACK_SIZE_ADJUST}; }`,
			});
			await page.evaluate(async () => {
				await document.fonts.load('14px "Layout fallback"');
				document.documentElement.style.setProperty(
					"--font-sans",
					'"Layout fallback", sans-serif',
				);
			});
			const heading = page.getByRole("heading", { name: "폼", exact: true });
			const button = page.getByRole("button", { name: "새 폼", exact: true });
			const top = await topOf(heading);
			await expect.poll(() => topOf(button)).toBe(top);
			await page.evaluate(() => {
				document.documentElement.style.removeProperty("--font-sans");
			});
			await expect.poll(() => topOf(button)).toBe(top);
		} finally {
			await context.close();
		}
	});
}
