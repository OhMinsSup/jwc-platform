import { expect } from "@playwright/test";
import type { Browser } from "@playwright/test";

import { E2E_FORM } from "../fixture";
import { PERFORMANCE_ORIGIN } from "./settings";

/** 실제 제출 경로로 메모리 응답을 만든다. 측정 시간에는 포함하지 않는다. */
export async function prepareSubmission(browser: Browser): Promise<string> {
	const context = await browser.newContext({ baseURL: PERFORMANCE_ORIGIN });
	try {
		const page = await context.newPage();
		await page.goto(`/f/${E2E_FORM.slug}`);
		await page.waitForLoadState("networkidle");
		await page.getByLabel("이름").fill("성능 검사");
		await page.getByLabel("전화번호").fill("01090009999");
		await page.getByLabel("방문 날짜").click();
		await page.getByRole("button", { name: /^2030년 1월 2일/u }).click();
		await page.getByRole("button", { name: "다음", exact: true }).click();
		await page.getByRole("button", { name: "제출하기", exact: true }).click();
		await expect(
			page.getByRole("heading", { name: "신청이 완료되었습니다" }),
		).toBeVisible();
		const id = new URL(page.url()).searchParams.get("id");
		if (!id) {
			throw new Error("성능 검사 응답이 만들어지지 않았습니다");
		}
		return `/r/${id}`;
	} finally {
		await context.close();
	}
}
