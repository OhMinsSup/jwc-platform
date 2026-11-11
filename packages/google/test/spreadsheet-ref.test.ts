import { describe, expect, it } from "vite-plus/test";

import {
	MAX_SHEET_TITLE_LENGTH,
	parseSpreadsheetId,
	sameSheetTitle,
	sheetTitleProblem,
	spreadsheetEditUrl,
} from "../src/spreadsheet-ref";

const ID = "1TestSpreadsheetId_abcdefghijklmnopqrstuvwx";

describe(parseSpreadsheetId, () => {
	it("주소창 URL에서 ID를 꺼낸다 (gid·해시 포함)", () => {
		expect(
			parseSpreadsheetId(
				`https://docs.google.com/spreadsheets/d/${ID}/edit?gid=0#gid=0`,
			),
		).toBe(ID);
	});

	it("ID만 넣어도 되고 앞뒤 공백은 무시한다", () => {
		expect(parseSpreadsheetId(`  ${ID} `)).toBe(ID);
	});

	it("알아볼 수 없는 값은 undefined", () => {
		expect(parseSpreadsheetId("https://example.com/sheet")).toBeUndefined();
		expect(parseSpreadsheetId("short")).toBeUndefined();
		expect(parseSpreadsheetId(`${ID}/../x`)).toBeUndefined();
	});
});

describe(sheetTitleProblem, () => {
	it("빈 이름, 너무 긴 이름, 제어 문자를 구분한다", () => {
		expect(sheetTitleProblem("")).toBe("empty");
		expect(sheetTitleProblem("가".repeat(MAX_SHEET_TITLE_LENGTH + 1))).toBe(
			"too_long",
		);
		expect(sheetTitleProblem("a\nb")).toBe("control_character");
		expect(sheetTitleProblem("신청자 목록")).toBeNull();
	});
});

describe(spreadsheetEditUrl, () => {
	it("편집 주소를 만든다", () => {
		expect(spreadsheetEditUrl(ID)).toBe(
			`https://docs.google.com/spreadsheets/d/${ID}/edit`,
		);
	});
});

describe(sameSheetTitle, () => {
	it("대소문자만 다른 이름은 같은 탭이다 (Google 규칙)", () => {
		expect(sameSheetTitle("Retreat", "retreat")).toBe(true);
		expect(sameSheetTitle("신청자목록", "신청자 목록")).toBe(false);
	});
});
