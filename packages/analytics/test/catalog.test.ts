import { describe, expect, it } from "vite-plus/test";

import { allowedProps, sanitizeUrlProperties } from "../src/catalog";

const EVENTS = { viewed: ["slug"] } as const;

describe(allowedProps, () => {
	it("카탈로그에 없는 속성(답변 값 등)은 보내지 않는다", () => {
		const props: Record<string, string> = { slug: "retreat", name: "홍길동" };
		expect(allowedProps(EVENTS, "viewed", props)).toStrictEqual({
			slug: "retreat",
		});
	});
});

describe(sanitizeUrlProperties, () => {
	it("URL 속성만 정리하고 다른 속성은 그대로 둔다", () => {
		const properties: Record<string, unknown> = {
			$current_url: "https://x.test/secret/123",
			$pathname: "/secret/123",
			slug: "/secret/123",
		};
		sanitizeUrlProperties(properties, (url) => url.replace("/123", "/:id"));
		expect(properties).toStrictEqual({
			$current_url: "https://x.test/secret/:id",
			$pathname: "/secret/:id",
			slug: "/secret/123",
		});
	});
});
