import { readFileSync } from "node:fs";

import { describe, expect, it } from "vite-plus/test";
import { z } from "zod";

import { BRAND_DESCRIPTION, BRAND_NAME } from "../src/platform/brand";
import {
	APP_ICON_TICKET_TRANSFORM,
	TICKET_PATHS,
} from "../src/platform/ui/brand-mark";

const publicFile = (name: string) =>
	readFileSync(new URL(`../public/${name}`, import.meta.url));

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47];
const ICO_HEADER = [0, 0, 1, 0];
const fileHeader = (name: string) => [...publicFile(name).subarray(0, 4)];

const Manifest = z.object({
	name: z.string(),
	short_name: z.string(),
	description: z.string(),
	icons: z.array(
		z.object({
			src: z.string(),
			sizes: z.string(),
			purpose: z.string().optional(),
		}),
	),
});

describe("브랜드 아이콘·manifest 계약", () => {
	it("favicon.svg는 화면의 접수표 표식과 같은 경로·배치를 쓴다", () => {
		const svg = publicFile("favicon.svg").toString("utf-8");
		for (const path of Object.values(TICKET_PATHS)) {
			expect(svg).toContain(`d="${path}"`);
		}
		expect(svg).toContain(`transform="${APP_ICON_TICKET_TRANSFORM}"`);
		expect(svg).toContain("prefers-color-scheme: dark");
	});

	it("manifest의 이름·설명은 서비스 상수와 같다", () => {
		const manifest = Manifest.parse(
			JSON.parse(publicFile("site.webmanifest").toString("utf-8")),
		);
		expect(manifest.name).toBe(BRAND_NAME);
		expect(manifest.short_name).toBe(BRAND_NAME);
		expect(manifest.description).toBe(BRAND_DESCRIPTION);
		expect(manifest.icons.some((icon) => icon.purpose === "maskable")).toBe(
			true,
		);
	});

	it("manifest와 head가 가리키는 래스터 아이콘이 실제 PNG/ICO 파일이다", () => {
		for (const name of [
			"icon-192.png",
			"icon-512.png",
			"icon-maskable-512.png",
			"apple-touch-icon.png",
		]) {
			expect(fileHeader(name)).toStrictEqual(PNG_SIGNATURE);
		}
		expect(fileHeader("favicon.ico")).toStrictEqual(ICO_HEADER);
	});
});
