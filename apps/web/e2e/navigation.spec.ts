import { expect, test } from "@playwright/test";

import { E2E_FORM } from "./fixture";

// oxlint-disable-next-line vitest/prefer-each -- Playwright는 test.each API를 제공하지 않는다.
for (const fail of [false, true]) {
	test(`이동 중 즉시 상태를 알리고 ${fail ? "실패" : "성공"} 후 해제한다`, async ({
		page,
	}) => {
		await page.goto(`/f/${E2E_FORM.slug}`);
		await page.waitForLoadState("networkidle");
		let resume: (() => void) | undefined;
		// oxlint-disable-next-line promise/avoid-new -- 로더 응답을 단언 이후에 해제하는 결정적 E2E 게이트다.
		const paused = new Promise<void>((resolve) => {
			resume = resolve;
		});
		await page.route("**/_serverFn/**", async (route) => {
			await paused;
			await (fail ? route.abort() : route.continue());
		});
		try {
			await page
				.getByRole("link", { name: "신청서 목록", exact: true })
				.click();
			await expect(
				page.getByRole("status", { name: "페이지 이동" }),
			).toBeVisible();
		} finally {
			resume?.();
		}
		await expect(
			page.getByRole("heading", {
				name: fail ? "문제가 발생했습니다" : "행사 신청은 여기에서",
			}),
		).toBeVisible();
		await expect(page.getByRole("status", { name: "페이지 이동" })).toHaveCount(
			0,
		);
	});
}
