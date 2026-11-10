import { readdirSync, readFileSync, writeFileSync } from "node:fs";

import { chromium } from "@playwright/test";
import type { Browser } from "@playwright/test";

import {
	BRAND_DESCRIPTION,
	BRAND_NAME,
	BRAND_TAGLINE,
} from "../src/platform/brand";
import {
	FAVICON_VARIANT,
	ICO_SIZES,
	OG_IMAGE,
	RASTER_ICONS,
	iconSvg,
	ogImageHtml,
	packIco,
} from "./brand-image-sources";

/**
 * public/favicon.svg에서 래스터 아이콘(PNG·ICO)과 공유 미리보기 이미지(og-image.png)를 다시 만든다.
 *
 *   pnpm -C apps/web brand:images
 *
 * favicon.svg나 서비스 이름·소개(src/platform/brand.ts)를 바꾼 뒤 실행하고, 결과 파일을 함께 커밋한다.
 * Playwright Chromium으로 그린다 (처음 한 번 `pnpm -C apps/web exec playwright install chromium`).
 * OG 이미지는 앱과 같은 고정 버전 글꼴을 jsDelivr에서 받으므로 네트워크가 필요하다.
 */

const PUBLIC_DIR = new URL("../public/", import.meta.url);
const FONTS_DIR = new URL("../src/fonts/", import.meta.url);
const OG_ICON_SIZE = 76;

async function render(
	browser: Browser,
	html: string,
	size: { width: number; height: number },
): Promise<Uint8Array> {
	const page = await browser.newPage({ viewport: size });
	try {
		await page.setContent(html, { waitUntil: "networkidle" });
		await page.evaluate(async () => {
			await document.fonts.ready;
		});
		return await page.screenshot({ omitBackground: true, type: "png" });
	} finally {
		await page.close();
	}
}

function squareHtml(svg: string): string {
	return `<!doctype html><body style="margin:0;background:transparent">${svg}</body>`;
}

function readFontCss(): string {
	return readdirSync(FONTS_DIR)
		.filter((name) => name.endsWith(".css"))
		.toSorted()
		.map((name) => readFileSync(new URL(name, FONTS_DIR), "utf-8"))
		.join("\n");
}

async function writeIcons(browser: Browser, favicon: string): Promise<void> {
	await Promise.all(
		RASTER_ICONS.map(async (variant) => {
			const square = { width: variant.size, height: variant.size };
			const png = await render(
				browser,
				squareHtml(iconSvg(favicon, variant)),
				square,
			);
			writeFileSync(new URL(variant.file, PUBLIC_DIR), png);
		}),
	);
	const images = await Promise.all(
		ICO_SIZES.map(async (size) => {
			const svg = iconSvg(favicon, { size, ...FAVICON_VARIANT });
			const png = await render(browser, squareHtml(svg), {
				width: size,
				height: size,
			});
			return { size, png };
		}),
	);
	writeFileSync(new URL("favicon.ico", PUBLIC_DIR), packIco(images));
}

async function writeOgImage(browser: Browser, favicon: string): Promise<void> {
	const icon = iconSvg(favicon, { size: OG_ICON_SIZE, ...FAVICON_VARIANT });
	const copy = {
		name: BRAND_NAME,
		tagline: BRAND_TAGLINE,
		description: BRAND_DESCRIPTION,
	};
	const png = await render(browser, ogImageHtml(copy, icon, readFontCss()), {
		width: OG_IMAGE.width,
		height: OG_IMAGE.height,
	});
	writeFileSync(new URL(OG_IMAGE.file, PUBLIC_DIR), png);
}

async function main(): Promise<void> {
	const favicon = readFileSync(new URL("favicon.svg", PUBLIC_DIR), "utf-8");
	const browser = await chromium.launch();
	try {
		await writeIcons(browser, favicon);
		await writeOgImage(browser, favicon);
	} finally {
		await browser.close();
	}
	console.log("브랜드 이미지를 public/에 다시 만들었습니다");
}

await main();
