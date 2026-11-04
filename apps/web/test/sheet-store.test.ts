import { parseFormDefinition, validateAnswers } from "@jwc/form-core";
import type { FormDefinition } from "@jwc/form-core";
import { retreat2026Definition } from "@jwc/form-core/samples";
import { beforeEach, describe, expect, it } from "vite-plus/test";

import {
	ensureSheetLayout,
	readAllRecords,
	readRecord,
	SheetLayoutError,
	writePaidCell,
	writeRecord,
} from "../src/server/services/sheet-store";
import { FakeSheets } from "./fakes";

const TAB = "retreat";
const NOW = Date.UTC(2026, 4, 1, 3, 0, 0);

function definition(): FormDefinition {
	const parsed = parseFormDefinition(retreat2026Definition);
	if (!parsed.ok) {
		throw new Error("fixture invalid");
	}
	return parsed.definition;
}

function record(id: string, overrides: Record<string, unknown> = {}) {
	const validation = validateAnswers(definition(), {
		name: "홍길동",
		phone: "010-1234-5678",
		gender: "male",
		department: "youth1",
		age_group: "y95",
		stay_type: "full",
		tf_team: "none",
		can_ride: false,
		...overrides,
	});
	if (!validation.ok) {
		throw new Error(JSON.stringify(validation.errors));
	}
	return {
		id,
		submittedAt: NOW,
		updatedAt: NOW,
		paid: false,
		answers: validation.answers,
	};
}

describe("시트 저장소 (Sheets as DB)", () => {
	let sheets: FakeSheets;
	beforeEach(() => {
		sheets = new FakeSheets();
	});

	it("탭이 없으면 만들고 헤더/고정행/드롭다운을 준비한다", async () => {
		const headers = await ensureSheetLayout(sheets, TAB, definition());
		expect(sheets.tabs.get(TAB)?.[0]).toStrictEqual(headers);
		expect(headers[0]).toBe("응답 ID");
		expect(
			sheets.batchRequests.some((r) =>
				JSON.stringify(r).includes("ONE_OF_LIST"),
			),
		).toBe(true);
	});

	it("같은 레코드를 두 번 써도 행이 하나다 (재시도 멱등)", async () => {
		await writeRecord(sheets, TAB, definition(), record("s1"));
		await writeRecord(
			sheets,
			TAB,
			definition(),
			record("s1", { name: "김철수" }),
		);
		const grid = sheets.tabs.get(TAB) ?? [];
		expect(grid).toHaveLength(2);
		const stored = await readRecord(sheets, TAB, definition(), "s1");
		expect(stored?.answers.name).toBe("김철수");
	});

	it("운영자가 열 순서를 바꾸고 메모 열을 추가해도 메모를 보존하며 갱신한다", async () => {
		await writeRecord(sheets, TAB, definition(), record("s1"));
		const grid = sheets.tabs.get(TAB) ?? [];
		for (const row of grid) {
			row.reverse();
			row.push(row === grid[0] ? "메모" : "중요");
		}
		await writeRecord(
			sheets,
			TAB,
			definition(),
			record("s1", { stay_type: "day", arrival_at: "2026-06-27T10:00" }),
		);
		const parsed = await readRecord(sheets, TAB, definition(), "s1");
		expect(parsed?.answers.stay_type).toBe("day");
		expect(parsed?.answers.arrival_at).toBe("2026-06-27T10:00");
		expect(grid[1]?.at(-1)).toBe("중요");
	});

	it("정의에 새 필드가 생기면 기존 열 뒤에 헤더를 추가한다", async () => {
		await writeRecord(sheets, TAB, definition(), record("s1"));
		const extended = parseFormDefinition({
			...retreat2026Definition,
			fields: [
				...retreat2026Definition.fields,
				{ id: "memo", type: "short_text", label: "남길 말" },
			],
			pages: retreat2026Definition.pages.map((p) =>
				p.id === "support" ? { ...p, fieldIds: [...p.fieldIds, "memo"] } : p,
			),
		});
		if (!extended.ok) {
			throw new Error("extended invalid");
		}
		await writeRecord(sheets, TAB, extended.definition, {
			...record("s2"),
			answers: { ...record("s2").answers, memo: "잘 부탁드려요" },
		});
		expect(sheets.tabs.get(TAB)?.[0]?.at(-1)).toBe("남길 말");
		const all = await readAllRecords(sheets, TAB, extended.definition);
		expect(all.size).toBe(2);
		expect(all.get("s2")?.answers.memo).toBe("잘 부탁드려요");
	});

	it("회귀: 운영자가 탭을 삭제해도 다음 쓰기에서 탭과 헤더를 다시 만든다", async () => {
		await writeRecord(sheets, TAB, definition(), record("s1"));
		sheets.tabs.delete(TAB);
		await writeRecord(sheets, TAB, definition(), record("s1"));
		expect(sheets.tabs.get(TAB)).toHaveLength(2);
	});

	it("납입여부 셀만 갱신한다", async () => {
		await writeRecord(sheets, TAB, definition(), record("s1"));
		await writePaidCell(sheets, TAB, "s1", true);
		const stored = await readRecord(sheets, TAB, definition(), "s1");
		expect(stored?.paid).toBe(true);
	});

	it("없는 응답의 납입 갱신은 구체적 오류", async () => {
		await ensureSheetLayout(sheets, TAB, definition());
		await expect(
			writePaidCell(sheets, TAB, "nope", true),
		).rejects.toBeInstanceOf(SheetLayoutError);
	});
});
