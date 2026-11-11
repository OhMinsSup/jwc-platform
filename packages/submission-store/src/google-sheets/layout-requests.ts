import type { ColumnPlan, SheetLayoutPlan, TablePlan } from "./layout-plan";
import { SHEET_COLORS } from "./sheet-style";

/**
 * 준비 계획(layout-plan.ts) → Sheets batchUpdate 요청. 판단하지 않고 값을 요청 형식으로 바꾸기만 한다.
 */

/** 표 머리글·줄무늬 색 */
const TABLE_ROWS_PROPERTIES = {
	headerColorStyle: { rgbColor: SHEET_COLORS.header },
	firstBandColorStyle: { rgbColor: SHEET_COLORS.firstBand },
	secondBandColorStyle: { rgbColor: SHEET_COLORS.secondBand },
};

function freezeHeader(sheetId: number) {
	return {
		updateSheetProperties: {
			properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
			fields: "gridProperties.frozenRowCount",
		},
	};
}

/** 머리글 글자: 짙은 머리글 색 위에서 읽히도록 흰 굵은 글자 (바탕색은 표가 정한다) */
function headerText(sheetId: number, columnCount: number) {
	return {
		repeatCell: {
			range: {
				sheetId,
				startRowIndex: 0,
				endRowIndex: 1,
				startColumnIndex: 0,
				endColumnIndex: columnCount,
			},
			cell: {
				userEnteredFormat: {
					textFormat: {
						bold: true,
						foregroundColorStyle: { rgbColor: SHEET_COLORS.headerText },
					},
				},
			},
			fields: "userEnteredFormat.textFormat",
		},
	};
}

function createTable(
	sheetId: number,
	columnCount: number,
	table: Extract<TablePlan, { action: "create" }>,
): unknown[] {
	return [
		// 표와 겹치면 만들 수 없는 이전 버전의 줄무늬·필터를 먼저 지운다 (데이터는 그대로)
		...table.removeBandingIds.map((bandedRangeId) => ({
			deleteBanding: { bandedRangeId },
		})),
		...(table.clearBasicFilter ? [{ clearBasicFilter: { sheetId } }] : []),
		{
			addTable: {
				table: {
					name: table.name,
					range: {
						sheetId,
						startRowIndex: 0,
						endRowIndex: table.rowCount,
						startColumnIndex: 0,
						endColumnIndex: columnCount,
					},
					rowsProperties: TABLE_ROWS_PROPERTIES,
					columnProperties: table.columns,
				},
			},
		},
	];
}

function tableRequests(
	sheetId: number,
	columnCount: number,
	table: TablePlan,
): unknown[] {
	if (table.action === "create") {
		return [
			...createTable(sheetId, columnCount, table),
			headerText(sheetId, columnCount),
		];
	}
	if (table.action === "extend") {
		return [
			{
				updateTable: {
					table: {
						tableId: table.tableId,
						range: { ...table.range, sheetId },
						columnProperties: table.columnProperties,
					},
					fields: "range,columnProperties",
				},
			},
			headerText(sheetId, columnCount),
		];
	}
	return [];
}

export function columnRequests(sheetId: number, column: ColumnPlan): unknown[] {
	const { index, width, numberFormat } = column;
	const requests: unknown[] = [];
	if (width !== null) {
		requests.push({
			updateDimensionProperties: {
				range: {
					sheetId,
					dimension: "COLUMNS",
					startIndex: index,
					endIndex: index + 1,
				},
				properties: { pixelSize: width },
				fields: "pixelSize",
			},
		});
	}
	if (numberFormat !== null) {
		requests.push({
			repeatCell: {
				range: {
					sheetId,
					startRowIndex: 1,
					startColumnIndex: index,
					endColumnIndex: index + 1,
				},
				cell: { userEnteredFormat: { numberFormat } },
				fields: "userEnteredFormat.numberFormat",
			},
		});
	}
	return requests;
}

export function layoutRequests(
	sheetId: number,
	plan: SheetLayoutPlan,
): unknown[] {
	return [
		freezeHeader(sheetId),
		...tableRequests(sheetId, plan.headers.length, plan.table),
		...plan.columns.flatMap((column) => columnRequests(sheetId, column)),
	];
}
