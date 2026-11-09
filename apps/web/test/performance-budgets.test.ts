import { describe, expect, it } from "vite-plus/test";

import { distribution, summarize } from "../e2e/performance/statistics";

describe("성능 실험실 집계", () => {
	it("5개 표본의 네 번째 값을 p75로 쓰며 전체 범위를 남긴다", () => {
		const values = [5000, 1100, 1300, 1200, 1400];
		expect(distribution(values)).toStrictEqual({
			count: 5,
			min: 1100,
			p75: 1400,
			max: 5000,
		});
		expect(values[0]).toBe(5000);
	});

	it("지표가 없는 경우 0으로 꾸미지 않는다", () => {
		expect(distribution([])).toBeNull();
		expect(summarize([{ metrics: { LCP: 1250, CLS: 0 } }])).toStrictEqual({
			LCP: { count: 1, min: 1250, p75: 1250, max: 1250 },
			CLS: { count: 1, min: 0, p75: 0, max: 0 },
			INP: null,
			TTFB: null,
		});
	});
});
