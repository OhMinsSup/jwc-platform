import { describe, expect, it } from "vite-plus/test";

import { isUniqueViolation } from "../src/platform/server/db-errors";

describe(isUniqueViolation, () => {
	it("drizzle이 감싼 D1 유니크 위반을 알아본다", () => {
		const driver = new Error(
			"D1_ERROR: UNIQUE constraint failed: forms.spreadsheet_id, forms.sheet_name: SQLITE_CONSTRAINT",
		);
		expect(
			isUniqueViolation(new Error("Failed query: update …", { cause: driver })),
		).toBe(true);
	});

	it("다른 DB 오류(없는 열 등)는 유니크 위반이 아니다", () => {
		const driver = new Error("D1_ERROR: no such column: spreadsheet_id");
		expect(
			isUniqueViolation(new Error("Failed query: update …", { cause: driver })),
		).toBe(false);
		expect(isUniqueViolation("UNIQUE constraint failed")).toBe(false);
	});
});
