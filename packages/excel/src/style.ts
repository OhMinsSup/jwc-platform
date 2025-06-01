import type * as Excel from "exceljs";

/**
 * Excel 스타일 유틸리티 클래스
 *
 * Excel 헤더 셀과 데이터 셀에 일관된 스타일을 적용하는 메서드를 제공합니다.
 */
export class ExcelStyle {
	/**
	 * 헤더 셀에 스타일을 적용합니다.
	 *
	 * @param cell - 스타일을 적용할 Excel 셀 객체
	 * @remarks
	 * - 배경색, 테두리, 폰트, 정렬 등 헤더에 적합한 스타일을 지정합니다.
	 */
	styleHeaderCell(cell: Excel.Cell): void {
		cell.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: "ffebebeb" },
		};
		cell.border = {
			bottom: { style: "thin", color: { argb: "-100000f" } },
			right: { style: "thin", color: { argb: "-100000f" } },
		};
		cell.font = {
			name: "Arial",
			size: 12,
			bold: true,
			color: { argb: "ff252525" },
		};
		cell.alignment = {
			vertical: "middle",
			horizontal: "center",
			wrapText: true,
		};
	}

	/**
	 * 데이터 셀에 스타일을 적용합니다.
	 *
	 * @param cell - 스타일을 적용할 Excel 셀 객체
	 * @remarks
	 * - 배경색, 테두리, 폰트, 정렬 등 데이터 셀에 적합한 스타일을 지정합니다.
	 */
	styleDataCell(cell: Excel.Cell): void {
		cell.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: "ffffffff" },
		};
		cell.border = {
			bottom: { style: "thin", color: { argb: "-100000f" } },
			right: { style: "thin", color: { argb: "-100000f" } },
		};
		cell.font = {
			name: "Arial",
			size: 10,
			color: { argb: "ff252525" },
		};
		cell.alignment = {
			vertical: "middle",
			horizontal: "center",
			wrapText: true,
		};
	}
}
