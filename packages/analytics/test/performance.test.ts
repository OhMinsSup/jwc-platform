import { describe, expect, it } from "vite-plus/test";

import { sanitizePerformanceProperties } from "../src/performance";

describe("성능 지표 개인정보 경계", () => {
	it("숫자 지표만 남기고 중첩 URL·DOM·상세 원본을 버린다", () => {
		const properties: Record<string, unknown> = {
			$web_vitals_LCP_value: 1200,
			$web_vitals_INP_value: 48,
			$web_vitals_CLS_value: 0.01,
			$web_vitals_LCP_event: {
				navigationURL: "https://x.test/r/private-id",
				attribution: { target: "#personal-name" },
			},
			$web_vitals_INP_event: {
				$current_url: "https://x.test/f/a/done?id=private-id",
				entries: [{ target: "personal-value" }],
			},
		};
		sanitizePerformanceProperties(properties);
		expect(properties).toStrictEqual({
			$web_vitals_LCP_value: 1200,
			$web_vitals_INP_value: 48,
			$web_vitals_CLS_value: 0.01,
		});
	});

	it("일반 제품 이벤트의 허용된 속성은 유지한다", () => {
		const properties = { formSlug: "retreat", stepCount: 3 };
		sanitizePerformanceProperties(properties);
		expect(properties).toStrictEqual({ formSlug: "retreat", stepCount: 3 });
	});
});
