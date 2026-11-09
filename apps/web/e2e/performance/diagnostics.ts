import type { Page } from "@playwright/test";

/** 값·DOM·신청 URL 없이 리소스 종류별 전송량과 paint 시간만 남긴다. */
export function diagnostics(page: Page) {
	return page.evaluate(() => {
		const resources = performance.getEntriesByType("resource");
		const groups: Record<
			string,
			{ count: number; bytes: number; end: number }
		> = {};
		for (const entry of resources) {
			if (!(entry instanceof PerformanceResourceTiming)) {
				continue;
			}
			const kind = /\.woff2?(?:$|\?)/u.test(entry.name)
				? "font"
				: entry.initiatorType;
			const group = groups[kind] ?? { count: 0, bytes: 0, end: 0 };
			group.count += 1;
			group.bytes += entry.transferSize;
			group.end = Math.max(group.end, entry.responseEnd);
			groups[kind] = group;
		}
		return {
			paints: performance
				.getEntriesByType("paint")
				.map(({ name, startTime }) => ({ name, startTime })),
			resources: groups,
		};
	});
}
