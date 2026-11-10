import { readFileSync } from "node:fs";

import { describe, expect, it } from "vite-plus/test";
import { z } from "zod";

import {
	BRAND_DESCRIPTION,
	BRAND_NAME,
	BRAND_THEME_COLORS,
} from "../src/platform/brand";
import { PRIVATE_PATHS } from "../src/platform/server/security/policy";
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
	background_color: z.string(),
	theme_color: z.string(),
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
		expect({
			...manifest,
			hasMaskableIcon: manifest.icons.some(
				(icon) => icon.purpose === "maskable",
			),
		}).toMatchObject({
			name: BRAND_NAME,
			short_name: BRAND_NAME,
			description: BRAND_DESCRIPTION,
			background_color: BRAND_THEME_COLORS.light,
			theme_color: BRAND_THEME_COLORS.light,
			hasMaskableIcon: true,
		});
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

	it("주소창 색(theme-color)은 화면 바탕 토큰(--background)과 같다", () => {
		const css = readFileSync(
			new URL("../src/styles.css", import.meta.url),
			"utf-8",
		);
		expect(css).toContain(`--background: ${BRAND_THEME_COLORS.light};`);
		expect(css).toContain(`--background: ${BRAND_THEME_COLORS.dark};`);
	});
});

/** robots.txt를 User-agent 묶음별 규칙으로 나눈다 (빈 줄이 묶음 경계) */
function robotsGroups(text: string) {
	return text
		.split(/\n\s*\n/u)
		.map((block) =>
			block
				.split("\n")
				.map((line) => line.trim())
				.filter((line) => line.length > 0 && !line.startsWith("#")),
		)
		.filter((lines) => lines.length > 0)
		.map((lines) => ({
			agents: lines
				.filter((line) => line.startsWith("User-agent:"))
				.map((line) => line.slice("User-agent:".length).trim()),
			rules: lines.filter((line) => !line.startsWith("User-agent:")),
		}));
}

const LINK_PREVIEW_BOTS = [
	"Twitterbot",
	"Slackbot",
	"facebookexternalhit",
	"kakaotalk-scrap",
	"Discordbot",
	"TelegramBot",
];

describe("robots.txt: 검색은 막고 링크 미리보기만 연다", () => {
	const groups = robotsGroups(publicFile("robots.txt").toString("utf-8"));

	it("검색엔진(그 밖의 모든 수집기)은 전체를 막는다 (ADR-0015)", () => {
		const others = groups.find((group) => group.agents.includes("*"));
		expect(others?.rules).toStrictEqual(["Disallow: /"]);
	});

	it("링크 미리보기 수집기는 공개 화면을 읽되 개인정보 화면은 읽지 못한다", () => {
		const access = LINK_PREVIEW_BOTS.map((bot) => {
			const rules =
				groups.find((group) => group.agents.includes(bot))?.rules ?? [];
			const disallowed = rules
				.filter((rule) => rule.startsWith("Disallow:"))
				.map((rule) => rule.slice("Disallow:".length).trim());
			return {
				bot,
				allowsPublic: rules.includes("Allow: /"),
				blocksPrivate: PRIVATE_PATHS.every((privatePath) =>
					disallowed.some((path) => privatePath.test(path)),
				),
			};
		});
		expect(access).toStrictEqual(
			LINK_PREVIEW_BOTS.map((bot) => ({
				bot,
				allowsPublic: true,
				blocksPrivate: true,
			})),
		);
	});
});
