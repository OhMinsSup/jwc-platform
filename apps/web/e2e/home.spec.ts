import { expect, test } from "@playwright/test";

import { E2E_DEFINITION, E2E_FORM } from "./fixture";

const HOME_DESCRIPTION =
	"지금 접수 중인 신청서를 모았습니다. 신청서를 골라 신청하면 신청 내역과 안내를 문자로 보내드립니다.";

test("첫 화면은 메인 전용 설명을 주면서 검색 비노출을 유지한다", async ({
	page,
}) => {
	const response = await page.request.get("/");
	expect(response.status()).toBe(200);
	const html = await response.text();
	expect(html).toContain("<title>신청서 목록 | Formpass</title>");
	expect(html).toContain('name="robots" content="noindex, nofollow"');
	expect(html).toContain(`name="description" content="${HOME_DESCRIPTION}"`);
	expect(html).toContain(
		`property="og:description" content="${HOME_DESCRIPTION}"`,
	);
});

test("접수 중인 신청서 카드를 누르면 신청 화면으로 이동한다", async ({
	page,
}) => {
	await page.goto("/");
	await page.waitForLoadState("networkidle");
	const list = page.getByRole("region", { name: "접수 중인 신청서" });
	await expect(list).toBeVisible();
	await list
		.getByRole("link", { name: E2E_DEFINITION.title, exact: true })
		.click();
	await expect(page).toHaveURL(new RegExp(`/f/${E2E_FORM.slug}$`, "u"));
	await expect(
		page.getByRole("heading", { name: "기본 정보", exact: true }),
	).toBeVisible();
});

test("모든 화면이 접수표 앱 아이콘과 manifest를 내려준다", async ({ page }) => {
	await page.goto("/");
	await expect(
		page.locator('link[rel="icon"][type="image/svg+xml"]'),
	).toHaveAttribute("href", "/favicon.svg");
	await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
		"href",
		"/apple-touch-icon.png",
	);
	await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
		"href",
		"/site.webmanifest",
	);
	const icon = await page.request.get("/favicon.svg");
	expect(icon.status()).toBe(200);
	expect(icon.headers()["content-type"]).toContain("image/svg+xml");
	const manifest = await page.request.get("/site.webmanifest");
	expect(manifest.status()).toBe(200);
	expect(await manifest.json()).toMatchObject({ name: "Formpass" });
	const missing = await page.request.get("/no-such-icon.png");
	expect(missing.status()).toBe(404);
});

test("머리와 바닥은 특정 단체가 아닌 서비스 이름으로 안내한다", async ({
	page,
}) => {
	await page.goto("/");
	const header = page.getByRole("banner");
	await expect(
		header.getByRole("link", { name: "Formpass 처음 화면", exact: true }),
	).toBeVisible();
	const footer = page.getByRole("contentinfo");
	await expect(footer).toContainText("Formpass");
	await expect(footer).toContainText("신청 폼부터 접수 안내까지");
	// 폼 내용은 운영자가 정하므로 서비스 틀(머리·바닥)만 확인한다
	await expect(header).not.toContainText("청년부");
	await expect(footer).not.toContainText("청년부");
});

test("공유 미리보기는 사이트 출처의 절대 주소로 OG 이미지를 가리킨다", async ({
	page,
	baseURL,
}) => {
	const response = await page.request.get("/");
	const html = await response.text();
	const imageUrl = `${baseURL ?? ""}/og-image.png`;
	expect(html).toContain(`property="og:image" content="${imageUrl}"`);
	expect(html).toContain('property="og:image:width" content="1200"');
	expect(html).toContain('name="twitter:card" content="summary_large_image"');
	const image = await page.request.get("/og-image.png");
	expect(image.status()).toBe(200);
	expect(image.headers()["content-type"]).toContain("image/png");
});
