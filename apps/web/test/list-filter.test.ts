import { describe, expect, it } from "vite-plus/test";

import { countByStatus, matchesQuery } from "../src/lib/list-filter";

describe(matchesQuery, () => {
	it("passes everything for a blank query", () => {
		expect(matchesQuery("   ", "수련회")).toBe(true);
	});

	it("matches any text case-insensitively", () => {
		expect(matchesQuery("RETREAT", "수련회", "retreat-2026")).toBe(true);
		expect(matchesQuery("수련", "2026 여름 수련회")).toBe(true);
		expect(matchesQuery("겨울", "2026 여름 수련회", "summer")).toBe(false);
	});
});

describe(countByStatus, () => {
	it("counts each status and the total, including zero buckets", () => {
		const items = [
			{ status: "open" },
			{ status: "open" },
			{ status: "draft" },
		] as const;
		expect(countByStatus(items, ["draft", "open", "closed"])).toStrictEqual(
			new Map([
				["all", 3],
				["draft", 1],
				["open", 2],
				["closed", 0],
			]),
		);
	});
});
