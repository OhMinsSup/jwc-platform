import type { Page } from "@playwright/test";

import type { Interaction } from "./pages";

const typeFirst = async (page: Page) => {
	const input = page.locator('input:not([type="hidden"])').first();
	await input.pressSequentially("performance", { delay: 30 });
};

const INTERACTIONS: Record<Interaction, (page: Page) => Promise<void>> = {
	home: async (page) => {
		await page.getByRole("link", { name: "신청서 목록", exact: true }).click();
	},
	form: async (page) => {
		await page
			.getByLabel("이름")
			.pressSequentially("performance", { delay: 30 });
	},
	review: async (page) => {
		await page
			.getByRole("button", { name: "수정", exact: true })
			.first()
			.click();
	},
	done: async (page) => {
		await page.getByRole("button", { name: "신청 내역 보기" }).click();
	},
	submission: async (page) => {
		await page.getByRole("link", { name: "신청서 목록", exact: true }).click();
	},
	text: typeFirst,
	recovery: async (page) => {
		await page
			.getByRole("button", { name: "인증 앱을 사용할 수 없나요?" })
			.click();
		await page
			.getByLabel("복구 코드", { exact: true })
			.pressSequentially("recovery", { delay: 30 });
	},
	forms: typeFirst,
	admins: typeFirst,
	editor: async (page) => {
		await page.locator("#field-name button[aria-expanded]").click();
		await page
			.getByLabel("질문 제목", { exact: true })
			.pressSequentially("edit", { delay: 30 });
	},
	preview: async (page) => {
		await page.getByRole("button", { name: "데스크톱", exact: true }).click();
	},
	responses: typeFirst,
	"not-found": async (page) => {
		await page.getByRole("button", { name: "처음으로" }).click();
	},
};

export async function interact(page: Page, kind: Interaction) {
	await INTERACTIONS[kind](page);
}
