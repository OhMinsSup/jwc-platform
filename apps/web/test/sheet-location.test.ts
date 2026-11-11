import { MAX_SHEET_TITLE_LENGTH } from "@jwc/google/spreadsheet-ref";
import { describe, expect, it } from "vite-plus/test";

import {
	isSameSheet,
	normalizeLocation,
	sheetNameCandidates,
	parseSheetLocation,
	resolveSheet,
	SHEET_LOCATION_MESSAGES,
} from "../src/features/forms/domain/sheet-location";

const ID = "1TestSpreadsheetId_abcdefghijklmnopqrstuvwx";
const OTHER_ID = "1aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789_-abcd";

describe(parseSheetLocation, () => {
	it("주소창 URL을 붙여 넣으면 ID로, 빈 값은 기본 스프레드시트(null)로 저장한다", () => {
		const fromUrl = parseSheetLocation({
			spreadsheet: `https://docs.google.com/spreadsheets/d/${ID}/edit#gid=0`,
			sheetName: "a",
		});
		const empty = parseSheetLocation({ spreadsheet: "  ", sheetName: "a" });
		expect(fromUrl.ok && fromUrl.location.spreadsheetId).toBe(ID);
		expect(empty.ok && empty.location.spreadsheetId).toBeNull();
	});

	it("성공: 탭 이름은 앞뒤 공백을 지운다", () => {
		expect(
			parseSheetLocation({ spreadsheet: ID, sheetName: " 신청자목록 " }),
		).toStrictEqual({
			ok: true,
			location: { spreadsheetId: ID, sheetName: "신청자목록" },
		});
	});

	it("실패: 스프레드시트와 탭 이름 오류를 함께 알려 준다", () => {
		expect(
			parseSheetLocation({ spreadsheet: "nope", sheetName: "  " }),
		).toStrictEqual({
			ok: false,
			fieldErrors: {
				spreadsheetId: SHEET_LOCATION_MESSAGES.spreadsheetId,
				sheetName: SHEET_LOCATION_MESSAGES.sheetName.empty,
			},
		});
	});

	it("실패: 너무 긴 탭 이름, 줄바꿈이 든 탭 이름", () => {
		const long = parseSheetLocation({
			spreadsheet: "",
			sheetName: "가".repeat(MAX_SHEET_TITLE_LENGTH + 1),
		});
		expect(long.ok ? null : long.fieldErrors.sheetName).toBe(
			SHEET_LOCATION_MESSAGES.sheetName.too_long,
		);
		const control = parseSheetLocation({ spreadsheet: "", sheetName: "a\nb" });
		expect(control.ok ? null : control.fieldErrors.sheetName).toBe(
			SHEET_LOCATION_MESSAGES.sheetName.control_character,
		);
	});
});

describe(resolveSheet, () => {
	it("비어 있는 스프레드시트는 기본 ID로 채운다", () => {
		expect(
			resolveSheet({ spreadsheetId: null, sheetName: "a" }, ID),
		).toStrictEqual({ spreadsheetId: ID, sheetName: "a" });
	});
});

describe(isSameSheet, () => {
	it("기본 스프레드시트(null)와 기본 ID를 직접 적은 설정은 같은 곳이다", () => {
		expect(
			isSameSheet(
				resolveSheet({ spreadsheetId: null, sheetName: "a" }, ID),
				resolveSheet({ spreadsheetId: ID, sheetName: "a" }, ID),
			),
		).toBe(true);
	});

	it("다른 스프레드시트의 같은 탭 이름은 다른 곳이다", () => {
		expect(
			isSameSheet(
				{ spreadsheetId: ID, sheetName: "a" },
				{ spreadsheetId: OTHER_ID, sheetName: "a" },
			),
		).toBe(false);
	});
});

describe("같은 탭 판정 (회귀: Google 탭 이름은 대소문자를 구분하지 않는다)", () => {
	it("대소문자만 다른 탭 이름은 같은 탭이다", () => {
		expect(
			isSameSheet(
				{ spreadsheetId: ID, sheetName: "Retreat" },
				{ spreadsheetId: ID, sheetName: "retreat" },
			),
		).toBe(true);
	});
});

describe(normalizeLocation, () => {
	it("회귀: 기본 ID를 직접 적은 설정은 null(기본)로 저장해 DB 유니크 인덱스가 중복을 막게 한다", () => {
		expect(
			normalizeLocation({ spreadsheetId: ID, sheetName: "a" }, ID),
		).toStrictEqual({ spreadsheetId: null, sheetName: "a" });
		expect(
			normalizeLocation({ spreadsheetId: OTHER_ID, sheetName: "a" }, ID),
		).toStrictEqual({ spreadsheetId: OTHER_ID, sheetName: "a" });
	});
});

describe(sheetNameCandidates, () => {
	it("주소 이름부터 시작해 번호를 붙인다 (새 폼 탭 이름이 겹칠 때)", () => {
		expect(sheetNameCandidates("camp2027").slice(0, 3)).toStrictEqual([
			"camp2027",
			"camp2027-2",
			"camp2027-3",
		]);
	});
});
