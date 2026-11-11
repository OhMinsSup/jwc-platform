import { parseFormDefinition } from "@jwc/form-core/definition/definition";
import type { FormDefinition } from "@jwc/form-core/definition/definition";
import { retreat2026Definition } from "@jwc/form-core/samples/retreat-2026";
import { headerRow } from "@jwc/form-core/sheet/columns";
import { FakeSheets } from "@jwc/google/testing";
import { beforeEach, describe, expect, it } from "vite-plus/test";

import { ensureSheetLayout } from "../src/google-sheets/sheet-layout";
import { writeRecord } from "../src/google-sheets/sheet-table";
import { createTabCache } from "../src/google-sheets/tab-cache";
import type { TabCache } from "../src/google-sheets/tab-cache";

const TAB = "신청자목록";
const NOW = Date.UTC(2026, 4, 1, 3, 0, 0);

function definition(): FormDefinition {
	const parsed = parseFormDefinition(retreat2026Definition);
	if (!parsed.ok) {
		throw new Error("fixture invalid");
	}
	return parsed.definition;
}

/** 탭 메타데이터 읽기 횟수를 센다 */
class CountingSheets extends FakeSheets {
	listCalls = 0;
	override listSheets() {
		this.listCalls += 1;
		return super.listSheets();
	}
}

function record(id: string) {
	return {
		id,
		submittedAt: NOW,
		paid: false,
		answers: { name: "홍길동", arrival_at: "2026-06-26T14:30" },
	};
}

describe("쓰기 경로의 탭 정보 캐시", () => {
	let sheets: CountingSheets;
	let tabs: TabCache;
	beforeEach(() => {
		sheets = new CountingSheets();
		tabs = createTabCache(sheets);
	});

	it("회귀: 발행 전에 만들어진 탭도 첫 쓰기에서 날짜 서식을 건다 (일련번호가 숫자로 보이지 않게)", async () => {
		// 이전 버전 헤더의 탭: 빠진 열이 없어 탭 준비를 건너뛰는 경우
		const legacy = [
			"응답 ID",
			"제출일시",
			"수정일시",
			...headerRow(definition()).slice(2),
		];
		sheets.tabs.set(TAB, [legacy]);
		await writeRecord(sheets, tabs, TAB, definition(), record("s1"));
		const serialized = JSON.stringify(sheets.batchRequests);
		expect(serialized).toContain("yyyy년 mm월 dd일");
		expect(serialized).toContain("am/pm h:mm");
	});

	it("새 응답마다 탭 정보를 다시 읽지 않는다 (탭마다 한 번)", async () => {
		await ensureSheetLayout(sheets, TAB, definition());
		sheets.listCalls = 0;
		await writeRecord(sheets, tabs, TAB, definition(), record("s1"));
		await writeRecord(sheets, tabs, TAB, definition(), record("s2"));
		await writeRecord(sheets, tabs, TAB, definition(), record("s3"));
		expect(sheets.listCalls).toBe(1);
		expect(sheets.tabs.get(TAB)?.map((row) => row[0])).toStrictEqual([
			"ID",
			"s1",
			"s2",
			"s3",
		]);
	});

	it("캐시한 표가 지워졌으면 탭 정보를 다시 읽고 한 번만 다시 시도한다", async () => {
		await ensureSheetLayout(sheets, TAB, definition());
		await writeRecord(sheets, tabs, TAB, definition(), record("s1"));
		sheets.meta.set(TAB, { tables: [] });
		await writeRecord(sheets, tabs, TAB, definition(), record("s2"));
		expect(sheets.tabs.get(TAB)?.at(-1)?.[0]).toBe("s2");
	});

	it("탭 이름의 대소문자가 달라도 같은 탭으로 찾는다 (Google 규칙)", async () => {
		await ensureSheetLayout(sheets, "Retreat", definition());
		await writeRecord(sheets, tabs, "retreat", definition(), record("s1"));
		const handle = await tabs.handle("RETREAT", definition(), []);
		expect(handle?.tableId).not.toBeNull();
	});
});
