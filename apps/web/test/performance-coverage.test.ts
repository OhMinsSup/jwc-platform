import { readdirSync } from "node:fs";

import { describe, expect, it } from "vite-plus/test";

import { E2E_FORM } from "../e2e/fixture";
import { performancePages } from "../e2e/performance/pages";

describe("전 페이지 성능 검사 범위", () => {
	it("화면 라우트가 추가되면 성능 시나리오 누락을 알린다", () => {
		const files = readdirSync(new URL("../src/routes", import.meta.url), {
			recursive: true,
		});
		const routes = files
			.filter((file): file is string => typeof file === "string")
			.filter(
				(file) =>
					file.endsWith(".tsx") &&
					!file.endsWith("route.tsx") &&
					!file.startsWith("__"),
			)
			.map(
				(file) =>
					`/${file.replaceAll("_console/", "").replaceAll(/(?:^|\/)index\.tsx$|\.tsx$/gu, "")}`.replace(
						/\/$/u,
						"",
					) || "/",
			);
		const pages = performancePages("/r/fixture");
		const covered = pages
			.filter((page) => page.status !== 404)
			.map(({ path }) =>
				path
					.split("?")[0]
					?.replace(`/f/${E2E_FORM.slug}`, "/f/$slug")
					.replace(`/admin/forms/${E2E_FORM.id}`, "/admin/forms/$formId")
					.replace("/r/fixture", "/r/$id"),
			);
		expect(new Set(covered)).toStrictEqual(new Set(routes));
		expect(new Set(pages.map(({ name }) => name)).size).toBe(pages.length);
	});
});
