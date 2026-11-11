import { parseFormDefinition } from "@jwc/form-core/definition/definition";
import type { FormDefinition } from "@jwc/form-core/definition/definition";
import { retreat2026Definition } from "@jwc/form-core/samples/retreat-2026";
import { FakeSheets } from "@jwc/google/testing";
import { beforeEach, describe, expect, it } from "vite-plus/test";

import { ensureSheetLayout } from "../src/google-sheets/sheet-layout";
import { writeRecord } from "../src/google-sheets/sheet-table";
import { createTabCache } from "../src/google-sheets/tab-cache";

/** 계획 → 요청 변환과 I/O 순서만 확인한다 (무엇을 할지는 layout-plan.test.ts) */

const TAB = "신청자목록";
const NOW = Date.UTC(2026, 4, 1, 3, 0, 0);

function definition(): FormDefinition {
	const parsed = parseFormDefinition(retreat2026Definition);
	if (!parsed.ok) {
		throw new Error("fixture invalid");
	}
	return parsed.definition;
}

function kindsOf(requests: unknown[]): string[] {
	return requests.flatMap((request) =>
		typeof request === "object" && request !== null ? Object.keys(request) : [],
	);
}

describe("응답 탭 준비 (I/O)", () => {
	let sheets: FakeSheets;
	beforeEach(() => {
		sheets = new FakeSheets();
	});

	it("새 탭을 만들고 헤더를 쓴 뒤 시트 표를 만든다", async () => {
		const headers = await ensureSheetLayout(sheets, TAB, definition());
		expect(sheets.tabs.get(TAB)?.[0]).toStrictEqual(headers);
		expect(kindsOf(sheets.batchRequests).slice(0, 3)).toStrictEqual([
			"updateSheetProperties",
			"addTable",
			"repeatCell",
		]);
		const [listed] = await sheets.listSheets();
		expect(listed?.tables.map((table) => table.name)).toStrictEqual([TAB]);
	});

	it("다시 준비해도 표를 또 만들지 않는다", async () => {
		await ensureSheetLayout(sheets, TAB, definition());
		sheets.batchRequests.length = 0;
		await ensureSheetLayout(sheets, TAB, definition());
		expect(kindsOf(sheets.batchRequests)).not.toContain("addTable");
	});

	it("새 응답은 표 본문의 빈 행부터 채운다 (표 범위가 함께 늘어난다)", async () => {
		await ensureSheetLayout(sheets, TAB, definition());
		sheets.tabs.get(TAB)?.push(Array.from({ length: 3 }, () => ""));
		await writeRecord(sheets, createTabCache(sheets), TAB, definition(), {
			id: "s1",
			submittedAt: NOW,
			paid: false,
			answers: { name: "홍길동" },
		});
		const grid = sheets.tabs.get(TAB) ?? [];
		expect(grid).toHaveLength(2);
		expect(grid[1]?.[0]).toBe("s1");
	});

	it("회귀: 응답 탭이 첫 탭이 아니어도 새 응답은 그 탭의 표에 들어간다", async () => {
		sheets.tabs.set("시트1", []);
		await ensureSheetLayout(sheets, TAB, definition());
		await writeRecord(sheets, createTabCache(sheets), TAB, definition(), {
			id: "s1",
			submittedAt: NOW,
			paid: false,
			answers: { name: "홍길동" },
		});
		expect(sheets.tabs.get("시트1")).toStrictEqual([]);
		expect(sheets.tabs.get(TAB)?.[1]?.[0]).toBe("s1");
	});
});
