/**
 * 셀 값 형식과 표 행 추가 요청 (Sheets API 형식으로 바꾸는 순수 함수).
 */

/** 쓸 셀. null은 그 칸을 건드리지 않는다 */
export type CellValue = string | number | null;
/** 읽은 셀 (서식 없는 원래 값) */
export type ReadCell = string | number | boolean;

/** 행을 더할 시트 "표" (표가 있는 탭의 sheetId와 표 ID) */
export interface TableTarget {
	sheetId: number;
	tableId: string;
}

/** 쓸 셀 → CellData. 글자는 해석하지 않은 그대로(RAW와 같음), null은 빈 칸 */
function toCellData(cell: CellValue) {
	if (cell === null || cell === "") {
		return {};
	}
	return typeof cell === "number"
		? { userEnteredValue: { numberValue: cell } }
		: { userEnteredValue: { stringValue: cell } };
}

/**
 * 표 본문 끝(첫 빈 행)에 행을 더하는 batchUpdate 요청.
 * sheetId도 함께 보낸다: 빼면 실제 API는 tableId 대신 기본값 0(첫 탭)에 붙인다 (2026-11 확인)
 */
export function appendTableRowsRequest(
	{ sheetId, tableId }: TableTarget,
	rows: CellValue[][],
) {
	return {
		appendCells: {
			sheetId,
			tableId,
			rows: rows.map((row) => ({ values: row.map(toCellData) })),
			fields: "userEnteredValue",
		},
	};
}
