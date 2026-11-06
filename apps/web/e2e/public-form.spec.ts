import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { E2E_FORM } from "./fixture";

const FORM_PATH = `/f/${E2E_FORM.slug}`;

/**
 * 신청 화면을 열고 하이드레이션이 끝날 때까지 기다린다.
 * 서버 렌더 HTML은 바로 보이지만, 그 전에 누른 키·클릭은 React 핸들러가 받지 못한다.
 */
async function openForm(page: Page) {
	await page.goto(FORM_PATH);
	await page.waitForLoadState("networkidle");
}

/** 키보드만으로 달력을 열고, 화살표로 하루 옮겨, Enter로 고른다 (실제 브라우저의 키보드 이동 확인) */
async function pickDateWithKeyboard(page: Page) {
	await page.getByLabel("방문 날짜").focus();
	await page.keyboard.press("Enter");
	const focusedDay = page.locator('[role="grid"] button:focus');
	await expect(focusedDay).toHaveAttribute("aria-label", /^2030년 1월 1일/u);
	await page.keyboard.press("ArrowRight");
	await expect(focusedDay).toHaveAttribute("aria-label", /^2030년 1월 2일/u);
	await page.keyboard.press("Enter");
	await expect(page.getByRole("grid")).toBeHidden();
}

test("필수 항목을 채우고 날짜를 골라 제출하면 완료 화면이 보인다", async ({
	page,
}) => {
	await openForm(page);
	await page.getByLabel("이름").fill("김테스트");
	await page.getByLabel("전화번호").fill("010-1234-5678");
	await pickDateWithKeyboard(page);
	await expect(page.getByLabel("방문 날짜")).toContainText("2030년 1월 2일");

	await page.getByRole("button", { name: "다음" }).click();
	await expect(
		page.getByRole("heading", { name: "신청 내용 확인" }),
	).toBeVisible();
	await page.getByRole("button", { name: "제출하기" }).click();

	await expect(page.getByText("신청이 완료되었습니다")).toBeVisible();
});

test("필수 항목을 비우고 다음을 누르면 오류를 보이고 넘어가지 않는다", async ({
	page,
}) => {
	await openForm(page);
	await page.getByLabel("이름").fill("김테스트");
	await page.getByRole("button", { name: "다음" }).click();

	await expect(page.getByText("필수 항목입니다").first()).toBeVisible();
	await expect(page.getByLabel("전화번호")).toHaveAttribute(
		"aria-invalid",
		"true",
	);
	await expect(
		page.getByRole("heading", { name: "신청 내용 확인" }),
	).toHaveCount(0);
});
