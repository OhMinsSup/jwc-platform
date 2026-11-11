import { parseFormDefinition } from "@jwc/form-core/definition/definition";
import type { FormDefinition } from "@jwc/form-core/definition/definition";
import { retreat2026Definition } from "@jwc/form-core/samples/retreat-2026";
import { headerRow } from "@jwc/form-core/sheet/columns";
import type { SheetInfo, TableInfo } from "@jwc/google/sheet-info";
import { describe, expect, it } from "vite-plus/test";

import {
	planSheetLayout,
	tableNameFor,
} from "../src/google-sheets/layout-plan";
import type {
	SheetLayoutPlan,
	TabState,
} from "../src/google-sheets/layout-plan";
import { VALUE_FORMATS } from "../src/google-sheets/sheet-style";

const TAB = "신청자목록";

function definition(): FormDefinition {
	const parsed = parseFormDefinition(retreat2026Definition);
	if (!parsed.ok) {
		throw new Error("fixture invalid");
	}
	return parsed.definition;
}

const HEADERS = headerRow(definition());

function info(overrides: Partial<SheetInfo> = {}): SheetInfo {
	return {
		title: TAB,
		sheetId: 1,
		bandings: [],
		hasBasicFilter: false,
		tables: [],
		...overrides,
	};
}

function ownTable(endColumnIndex: number): TableInfo {
	return {
		tableId: "t1",
		name: TAB,
		range: {
			startRowIndex: 0,
			endRowIndex: 10,
			startColumnIndex: 0,
			endColumnIndex,
		},
		// 운영자가 바꾼 열 타입 (그대로 보존돼야 한다)
		columnProperties: [
			{ columnIndex: 0, columnName: "ID", columnType: "TEXT" },
		],
	};
}

function plan(tab: Partial<TabState>): SheetLayoutPlan {
	return planSheetLayout(definition(), TAB, {
		info: undefined,
		headers: [],
		rowCount: 1,
		tableNames: new Set(),
		...tab,
	});
}

function tableColumn(result: SheetLayoutPlan, header: string) {
	return result.table.action === "create"
		? result.table.columns.find((column) => column.columnName === header)
		: undefined;
}

describe("응답 표 만들기", () => {
	it("새 탭: 모든 헤더로 표를 만들고 본문 1행을 둔다", () => {
		const result = plan({});
		expect(result.headers).toStrictEqual(HEADERS);
		expect(result.table).toMatchObject({
			action: "create",
			name: TAB,
			rowCount: 2,
			removeBandingIds: [],
			clearBasicFilter: false,
		});
	});

	it("값 종류는 표 열 타입, 선택지는 드롭다운 열이 된다", () => {
		const result = plan({});
		// 일시 질문은 날짜 열·시간 열로 나뉘어 표에서 각각 날짜·시간 값으로 고칠 수 있다
		expect(tableColumn(result, "참석일자")?.columnType).toBe("DATE");
		expect(tableColumn(result, "참석시간")?.columnType).toBe("TIME");
		expect(tableColumn(result, "참석일시")).toBeUndefined();
		expect(tableColumn(result, "이름")?.columnType).toBe("TEXT");
		expect(tableColumn(result, "납입여부")).toStrictEqual({
			columnIndex: HEADERS.indexOf("납입여부"),
			columnName: "납입여부",
			columnType: "DROPDOWN",
			dataValidationRule: {
				condition: {
					type: "ONE_OF_LIST",
					values: [{ userEnteredValue: "납입" }, { userEnteredValue: "미납" }],
				},
			},
		});
	});

	it("표가 없는 기존 탭: 기존 응답까지 덮고, 겹치는 이전 줄무늬·필터를 지운다", () => {
		const result = plan({
			info: info({
				bandings: [
					{
						bandedRangeId: 9,
						range: { startRowIndex: 0, startColumnIndex: 0 },
					},
				],
				hasBasicFilter: true,
			}),
			headers: HEADERS,
			rowCount: 40,
		});
		expect(result.table).toMatchObject({
			action: "create",
			rowCount: 40,
			removeBandingIds: [9],
			clearBasicFilter: true,
		});
	});
});

describe("기존 응답 표", () => {
	it("새 열이 없으면 표를 건드리지 않는다", () => {
		const result = plan({
			info: info({ tables: [ownTable(HEADERS.length)] }),
			headers: HEADERS,
		});
		expect(result.table).toStrictEqual({ action: "keep" });
	});

	it("새 질문 열이 생기면 범위를 넓히고, 운영자가 정한 기존 열 타입은 그대로 보낸다", () => {
		const result = plan({
			info: info({ tables: [ownTable(HEADERS.length - 1)] }),
			headers: HEADERS.slice(0, -1),
		});
		if (result.table.action !== "extend") {
			throw new Error("extend 계획이어야 합니다");
		}
		expect(result.table.range.endColumnIndex).toBe(HEADERS.length);
		expect(result.table.columnProperties[0]).toStrictEqual({
			columnIndex: 0,
			columnName: "ID",
			columnType: "TEXT",
		});
		expect(result.table.columnProperties.at(-1)).toMatchObject({
			columnIndex: HEADERS.length - 1,
			columnName: HEADERS.at(-1),
		});
	});

	it("A1이 아닌 곳에 다른 표가 있으면 표도 열 서식도 건드리지 않는다", () => {
		const other = {
			...ownTable(3),
			range: { startRowIndex: 5, startColumnIndex: 0 },
		};
		const result = plan({ info: info({ tables: [other] }), headers: HEADERS });
		expect(result.table).toStrictEqual({ action: "skip" });
		expect(result.columns).toStrictEqual([]);
	});
});

describe("이전 버전의 통짜 '참석일시' 열이 있는 표", () => {
	it("표를 넓혀 날짜(DATE)·시간(TIME) 열을 더하고, 기존 '참석일시' 열 속성은 그대로 둔다", () => {
		const legacy = HEADERS.filter((header) => header !== "참석시간").map(
			(header) => (header === "참석일자" ? "참석일시" : header),
		);
		const table = {
			...ownTable(legacy.length),
			columnProperties: [
				{
					columnIndex: legacy.indexOf("참석일시"),
					columnName: "참석일시",
					columnType: "DATE_TIME",
				},
			],
		};
		const result = plan({ info: info({ tables: [table] }), headers: legacy });
		if (result.table.action !== "extend") {
			throw new Error("extend 계획이어야 합니다");
		}
		const added = result.table.columnProperties.slice(1);
		expect(
			added.map((column) => [column.columnName, column.columnType]),
		).toStrictEqual([
			["참석일자", "DATE"],
			["참석시간", "TIME"],
		]);
		expect(result.table.columnProperties[0]?.columnType).toBe("DATE_TIME");
	});
});

describe("열 서식", () => {
	it("새 열에만 너비를 걸고, 날짜 서식은 기존 열에도 다시 건다", () => {
		const result = plan({
			info: info({ tables: [ownTable(HEADERS.length)] }),
			headers: HEADERS,
		});
		expect(result.columns.every((column) => column.width === null)).toBe(true);
		const arrival = result.columns.find(
			(column) => column.index === HEADERS.indexOf("참석일자"),
		);
		expect(arrival?.numberFormat).toStrictEqual(
			VALUE_FORMATS.date.numberFormat,
		);
	});

	it("이전 버전 헤더(응답 ID·제출일시·수정일시)가 있으면 열을 더하지 않는다", () => {
		const legacy = ["응답 ID", "제출일시", "수정일시", ...HEADERS.slice(2)];
		const result = plan({ info: info(), headers: legacy, rowCount: 3 });
		expect(result.headers).toStrictEqual(legacy);
		// 관리하지 않는 수정일시 열은 열 서식 계획에 없다
		expect(result.columns.some((column) => column.index === 2)).toBe(false);
	});
});

describe(tableNameFor, () => {
	it("글자·숫자·밑줄만 남기고, 숫자로 시작하면 접두어를 붙인다", () => {
		expect(tableNameFor("2026 여름-수련회", new Set())).toBe(
			"표_2026_여름_수련회",
		);
	});

	it("스프레드시트 안에서 겹치면 번호를 붙인다", () => {
		expect(tableNameFor("신청", new Set(["신청", "신청_2"]))).toBe("신청_3");
	});
});
