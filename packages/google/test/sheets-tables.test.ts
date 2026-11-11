import { jsonBody, recordingFetch, rejectionOf } from "@jwc/common/testing";
import { describe, expect, it } from "vite-plus/test";

import {
	createSheetsClient,
	DEFAULT_RETRY,
	SheetsApiError,
} from "../src/sheets-client";

/** 값 읽기 형식, 탭 메타데이터(표 포함), 표 행 추가의 요청/응답 계약 */

/** 재시도 없이 한 번만 보낸다 */
const NO_RETRY = { ...DEFAULT_RETRY, maxAttempts: 1 };
/** 기다리지 않고 재시도하는 정책 (재시도 여부만 확인한다) */
const INSTANT_RETRY = { ...DEFAULT_RETRY, sleep: () => Promise.resolve() };

describe("Sheets 클라이언트: 값 형식과 표", () => {
	it("값은 서식 없는 원래 값으로 읽는다 (날짜는 일련번호)", async () => {
		const fake = recordingFetch([
			Response.json({ values: [["ID", 46_199.5, true]] }),
		]);
		const client = createSheetsClient(
			"id",
			() => Promise.resolve("t"),
			fake.impl,
			NO_RETRY,
		);
		await expect(client.getValues("'a'!1:1")).resolves.toStrictEqual([
			["ID", 46_199.5, true],
		]);
		const url = new URL(fake.calls[0]?.url ?? "");
		expect(url.searchParams.get("valueRenderOption")).toBe("UNFORMATTED_VALUE");
		expect(url.searchParams.get("dateTimeRenderOption")).toBe("SERIAL_NUMBER");
	});

	it("탭 목록과 줄무늬/필터/표를 읽는다 (생략된 0 인덱스는 0)", async () => {
		const fake = recordingFetch([
			Response.json({
				sheets: [
					{
						properties: { title: "신청", sheetId: 0 },
						bandedRanges: [{ bandedRangeId: 7, range: { endColumnIndex: 5 } }],
						basicFilter: { range: {} },
					},
					{
						properties: { title: "표", sheetId: 3 },
						tables: [
							{
								tableId: "t1",
								name: "신청자목록",
								range: { sheetId: 3, endRowIndex: 9, endColumnIndex: 2 },
								columnProperties: [
									{ columnName: "ID", columnType: "TEXT" },
									{
										columnIndex: 1,
										columnName: "성별",
										columnType: "DROPDOWN",
										dataValidationRule: { condition: { type: "ONE_OF_LIST" } },
									},
								],
							},
						],
					},
				],
			}),
		]);
		const client = createSheetsClient(
			"id",
			() => Promise.resolve("t"),
			fake.impl,
			NO_RETRY,
		);
		const [plain, withTable] = await client.listSheets();
		expect(plain).toStrictEqual({
			title: "신청",
			sheetId: 0,
			bandings: [
				{
					bandedRangeId: 7,
					range: { startRowIndex: 0, startColumnIndex: 0, endColumnIndex: 5 },
				},
			],
			hasBasicFilter: true,
			tables: [],
		});
		expect(withTable?.tables[0]?.range).toStrictEqual({
			startRowIndex: 0,
			startColumnIndex: 0,
			endRowIndex: 9,
			endColumnIndex: 2,
		});
		// 운영자가 정한 열 속성은 그대로 보존한다 (열 추가 시 그대로 돌려보낸다)
		expect(withTable?.tables[0]?.columnProperties[1]).toStrictEqual({
			columnIndex: 1,
			columnName: "성별",
			columnType: "DROPDOWN",
			dataValidationRule: { condition: { type: "ONE_OF_LIST" } },
		});
	});

	it("표 행 추가: appendCells(tableId)로 글자는 해석 없이, 숫자는 숫자로 보낸다", async () => {
		const fake = recordingFetch([Response.json({})]);
		const client = createSheetsClient(
			"id",
			() => Promise.resolve("t"),
			fake.impl,
			NO_RETRY,
		);
		await client.appendTableRows({ sheetId: 42, tableId: "t1" }, [
			["s1", 46_199, null],
		]);
		expect(jsonBody(fake.calls[0])).toStrictEqual({
			requests: [
				{
					appendCells: {
						// 회귀: sheetId를 빼면 실제 API가 tableId 대신 기본값 0(첫 탭)에 붙였다
						sheetId: 42,
						tableId: "t1",
						rows: [
							{
								values: [
									{ userEnteredValue: { stringValue: "s1" } },
									{ userEnteredValue: { numberValue: 46_199 } },
									{},
								],
							},
						],
						fields: "userEnteredValue",
					},
				},
			],
		});
	});

	it("회귀: 표 행 추가는 5xx에 다시 보내지 않는다 (중복 행)", async () => {
		const fake = recordingFetch([new Response("x", { status: 500 })]);
		const client = createSheetsClient(
			"id",
			() => Promise.resolve("t"),
			fake.impl,
			INSTANT_RETRY,
		);
		await rejectionOf(
			client.appendTableRows({ sheetId: 42, tableId: "t1" }, [["x"]]),
			SheetsApiError,
		);
		expect(fake.calls).toHaveLength(1);
	});
});
