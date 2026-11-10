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

test("접수 중인 공개 신청폼은 SSR 메타와 함께 검색에 노출한다 (canonical·구조화 데이터)", async ({
	page,
	baseURL,
}) => {
	const response = await page.request.get(FORM_PATH);
	expect(response.status()).toBe(200);
	const html = await response.text();
	const canonical = `${baseURL ?? ""}${FORM_PATH}`;
	expect(html).toContain("<title>E2E 신청서 | Formpass</title>");
	expect(html).toContain(
		'name="robots" content="index, follow, max-image-preview:large, max-snippet:-1"',
	);
	expect(html).not.toContain("noindex");
	expect(html).toContain(`rel="canonical" href="${canonical}"`);
	expect(html).toContain(`property="og:url" content="${canonical}"`);
	expect(html).toContain(
		'name="description" content="E2E 폼의 신청 안내입니다."',
	);
	await openForm(page);
	await expect(page).toHaveTitle("E2E 신청서 | Formpass");
	await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
	await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
		"content",
		"E2E 신청서 | Formpass",
	);
	await expect(
		page.locator('link[rel="stylesheet"][href^="https://cdn.jsdelivr.net"]'),
	).toHaveCount(0);
	// 화면의 주제는 폼 제목 하나(h1), 단계 제목은 그 아래(h2)
	await expect(page.getByRole("heading", { level: 1 })).toHaveText(
		"E2E 신청서",
	);
	await expect(
		page.getByRole("heading", { level: 2, name: "기본 정보" }),
	).toBeVisible();
	const graph = await page
		.locator('script[type="application/ld+json"]')
		.textContent();
	expect(JSON.parse(graph ?? "{}")).toMatchObject({
		"@graph": [
			{ "@type": "WebSite" },
			{ "@type": "WebPage", url: canonical, name: "E2E 신청서" },
			{ "@type": "BreadcrumbList" },
		],
	});
});

test("신청 완료 화면은 검색에 노출하지 않고 canonical도 두지 않는다", async ({
	page,
}) => {
	const response = await page.request.get(`${FORM_PATH}/done?id=e2e-token`);
	const html = await response.text();
	expect(html).toContain('name="robots" content="noindex, nofollow"');
	expect(html).not.toContain('rel="canonical"');
	expect(html).not.toContain("application/ld+json");
});

test("독립 질문의 입력과 함께 조건부 질문의 표시·검증도 갱신한다", async ({
	page,
}) => {
	await openForm(page);
	await expect(page.getByLabel("추가 요청 내용")).toHaveCount(0);
	await page
		.getByRole("button", { name: "추가 요청 있음", exact: true })
		.click();
	await expect(page.getByLabel("추가 요청 내용")).toBeVisible();
	await page.getByRole("button", { name: "다음", exact: true }).click();
	await expect(page.getByLabel("추가 요청 내용")).toHaveAttribute(
		"aria-invalid",
		"true",
	);
	await page
		.getByRole("button", { name: "추가 요청 없음", exact: true })
		.click();
	await expect(page.getByLabel("추가 요청 내용")).toHaveCount(0);
});

test("폰트 CDN을 사용할 수 없어도 본문과 입력을 사용할 수 있다", async ({
	page,
}) => {
	await page.route("https://cdn.jsdelivr.net/**", (route) => route.abort());
	await openForm(page);
	await expect(
		page.getByRole("heading", { name: "기본 정보", exact: true }),
	).toBeVisible();
	await page.getByLabel("이름").fill("폰트 장애 테스트");
	await expect(page.getByLabel("이름")).toHaveValue("폰트 장애 테스트");
});
