import { readFileSync } from "node:fs";

import type { BrowserContext, Page } from "@playwright/test";
import type { Metric } from "web-vitals";
import type * as WebVitals from "web-vitals";
import { z } from "zod";

import { PERFORMANCE_ORIGIN } from "./settings";

const MetricSchema = z.object({
	documentUrl: z.string(),
	name: z.enum(["LCP", "INP", "CLS", "TTFB"]),
	value: z.number().nonnegative(),
});
export type VitalValues = Partial<
	Record<z.infer<typeof MetricSchema>["name"], number>
>;

declare global {
	interface Window {
		webVitals: typeof WebVitals;
		reportPerformanceVital: (metric: {
			documentUrl: string;
			name: string;
			value: number;
		}) => Promise<void>;
	}
}

function observeVitals() {
	const documentUrl = location.href;
	// oxlint-disable-next-line unicorn/consistent-function-scoping -- 이 함수 전체를 브라우저 init script로 직렬화하므로 콜백도 내부에 있어야 한다.
	const report = ({ name, value }: Metric) => {
		void window.reportPerformanceVital({ documentUrl, name, value });
	};
	window.webVitals.onLCP(report, { reportAllChanges: true });
	window.webVitals.onCLS(report, { reportAllChanges: true });
	window.webVitals.onINP(report, {
		reportAllChanges: true,
		durationThreshold: 16,
	});
	window.webVitals.onTTFB(report);
}

export async function observe(context: BrowserContext, path: string) {
	const values: VitalValues = {};
	const expectedUrl = new URL(path, PERFORMANCE_ORIGIN).href;
	await context.exposeBinding(
		"reportPerformanceVital",
		(_source, input: unknown) => {
			const metric = MetricSchema.parse(input);
			if (metric.documentUrl === expectedUrl) {
				values[metric.name] = metric.value;
			}
		},
	);
	const source = readFileSync(
		new URL("web-vitals.iife.js", import.meta.resolve("web-vitals")),
		"utf-8",
	);
	await context.addInitScript(
		`${source}\n;window.webVitals = webVitals;(${observeVitals.toString()})();`,
	);
	return values;
}

export async function throttle(page: Page) {
	const cdp = await page.context().newCDPSession(page);
	await cdp.send("Network.enable");
	await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
	await cdp.send("Network.emulateNetworkConditions", {
		offline: false,
		latency: 150,
		downloadThroughput: 200_000,
		uploadThroughput: 93_750,
	});
	await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
}
