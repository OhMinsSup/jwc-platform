import { expect, test } from "@playwright/test";

import { E2E_DEFINITION, E2E_FORM } from "./fixture";

const HOME_DESCRIPTION =
	"지금 접수 중인 신청서를 모았습니다. 신청서를 골라 신청하면 신청 내역과 안내를 문자로 보내드립니다.";

test("첫 화면은 메인 전용 설명과 함께 검색에 노출한다 (canonical·구조화 데이터)", async ({
	page,
	baseURL,
}) => {
	const response = await page.request.get("/");
	expect(response.status()).toBe(200);
	const html = await response.text();
	const home = `${baseURL ?? ""}/`;
	expect(html).toContain("<title>신청서 목록 | Formpass</title>");
	expect(html).toContain(
		'name="robots" content="index, follow, max-image-preview:large, max-snippet:-1"',
	);
	expect(html).not.toContain("noindex");
	expect(html).toContain(`rel="canonical" href="${home}"`);
	expect(html).toContain('name="application-name" content="Formpass"');
	expect(html).toContain(`name="description" content="${HOME_DESCRIPTION}"`);
	expect(html).toContain(
		`property="og:description" content="${HOME_DESCRIPTION}"`,
	);
	const graph =
		/<script type="application\/ld\+json"[^>]*>(?<json>[^<]+)<\/script>/u.exec(
			html,
		)?.groups?.json;
	expect(JSON.parse(graph ?? "{}")).toMatchObject({
		"@graph": [
			{ "@type": "WebSite", url: home, name: "Formpass" },
			{
				"@type": "CollectionPage",
				mainEntity: {
					"@type": "ItemList",
					itemListElement: expect.arrayContaining([
						expect.objectContaining({
							url: `${baseURL ?? ""}/f/${E2E_FORM.slug}`,
							name: E2E_DEFINITION.title,
						}),
					]),
				},
			},
		],
	});
});

test("수집기 파일: robots.txt는 개인정보 화면을 막고, sitemap·llms.txt는 공개 폼을 알린다", async ({
	page,
	baseURL,
}) => {
	const origin = baseURL ?? "";
	const robots = await page.request.get("/robots.txt");
	expect(robots.status()).toBe(200);
	const rules = await robots.text();
	expect(rules).toContain("User-agent: *\nAllow: /\n");
	for (const path of ["/r/", "/admin", "/api/", "/_serverFn/"]) {
		expect(rules).toContain(`Disallow: ${path}\n`);
	}
	expect(rules).toContain(`Sitemap: ${origin}/sitemap.xml`);

	const sitemap = await page.request.get("/sitemap.xml");
	expect(sitemap.headers()["content-type"]).toContain("application/xml");
	const xml = await sitemap.text();
	expect(xml).toContain(`<loc>${origin}/</loc>`);
	expect(xml).toContain(`<loc>${origin}/f/${E2E_FORM.slug}</loc>`);

	const llms = await page.request.get("/llms.txt");
	expect(await llms.text()).toContain(
		`[${E2E_DEFINITION.title}](${origin}/f/${E2E_FORM.slug})`,
	);
});

test("신청 내역 화면은 수집기에 막히고 검색에 노출하지 않는다", async ({
	page,
}) => {
	const response = await page.request.get("/r/e2e-no-such-id");
	expect(response.headers()["x-robots-tag"]).toBe("noindex, nofollow");
	const html = await response.text();
	expect(html).toContain('name="robots" content="noindex, nofollow"');
	expect(html).not.toContain('rel="canonical"');
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

test("카드 설명은 덮개 위에 있어 눌러도 이동하지 않고 글을 고를 수 있다", async ({
	page,
}) => {
	await page.goto("/");
	await page.waitForLoadState("networkidle");
	const description = page.getByText(E2E_DEFINITION.description ?? "", {
		exact: true,
	});
	await description.dblclick();
	await expect(page).toHaveURL(/\/$/u);
	const selected = await page.evaluate(() => window.getSelection()?.toString());
	expect(selected?.length).toBeGreaterThan(0);
});
