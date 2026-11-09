import { expect } from "@playwright/test";
import type {
	Browser,
	BrowserContext,
	BrowserContextOptions,
} from "@playwright/test";

import { diagnostics } from "./diagnostics";
import { interact } from "./interactions";
import { observe, throttle } from "./metrics";
import { authenticate } from "./pages";
import type { PerformancePage } from "./pages";
import { PERFORMANCE_ORIGIN } from "./settings";

const SETTLE_MS = 750;
const NAVIGATION_ONLY = new Set(["home", "done", "submission", "not-found"]);

export async function measure(
	browser: Browser,
	target: PerformancePage,
	options: BrowserContextOptions,
) {
	const context = await browser.newContext({
		...options,
		baseURL: PERFORMANCE_ORIGIN,
		locale: "ko-KR",
		timezoneId: "Asia/Seoul",
	});
	const metrics = await observe(context, target.path);
	const errors: string[] = [];
	context.setDefaultTimeout(15_000);
	context.setDefaultNavigationTimeout(30_000);
	try {
		const page = await openMeasuredPage(context, target, errors);
		const loading = await diagnostics(page);
		await interact(page, target.interaction);
		await page.waitForTimeout(SETTLE_MS);
		await page.goto("about:blank");
		// 문서를 떠나는 링크 클릭은 다음 paint가 없어 INP가 보고되지 않을 수 있다. 0으로 만들지 않는다.
		const requiredMetrics = NAVIGATION_ONLY.has(target.interaction)
			? ["LCP", "CLS"]
			: ["LCP", "CLS", "INP"];
		await expect
			.poll(() => Object.keys(metrics))
			.toEqual(expect.arrayContaining(requiredMetrics));
		expect(errors, target.name).toEqual([]);
		return {
			metrics,
			loading,
			errors,
			requiresInp: !NAVIGATION_ONLY.has(target.interaction),
		};
	} finally {
		await context.close();
	}
}

async function openMeasuredPage(
	context: BrowserContext,
	target: PerformancePage,
	errors: string[],
) {
	if (target.account) {
		await authenticate(context, target.account);
	}
	const page = await context.newPage();
	page.on("pageerror", (error) => errors.push(error.message));
	page.on("requestfailed", (request) => {
		if (request.failure()?.errorText !== "net::ERR_ABORTED") {
			errors.push(`request_failed:${request.resourceType()}`);
		}
	});
	page.on("dialog", (dialog) => {
		void dialog.accept();
	});
	await throttle(page);
	const response = await page.goto(target.path, { waitUntil: "networkidle" });
	expect(response?.status(), target.name).toBe(target.status ?? 200);
	expect(new URL(page.url()).pathname.replace(/\/$/u, ""), target.name).toBe(
		new URL(target.path, PERFORMANCE_ORIGIN).pathname.replace(/\/$/u, ""),
	);
	await expect(
		page.getByRole("heading", { name: target.heading, exact: true }).first(),
	).toBeVisible();
	expect(errors, target.name).toEqual([]);
	expect(
		await page.evaluate(() => ({
			vitals: typeof window.webVitals,
			binding: typeof window.reportPerformanceVital,
		})),
	).toEqual({ vitals: "object", binding: "function" });
	return page;
}
