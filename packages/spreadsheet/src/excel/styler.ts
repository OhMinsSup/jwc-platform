import type * as Excel from "exceljs";

/**
 * Excel 스타일 관리 클래스
 * Excel 파일의 셀 스타일을 일관되게 적용하는 기능을 제공합니다.
 */
export class ExcelStyleManager {
	/**
	 * 헤더 셀에 스타일을 적용합니다.
	 * @param cell - 스타일을 적용할 셀 객체
	 */
	styleHeaderCell(cell: Excel.Cell): void {
		// 배경색 설정
		cell.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: "FF4F81BD" }, // 파란색 배경
		};

		// 폰트 설정
		cell.font = {
			name: "Arial",
			family: 2,
			size: 11,
			bold: true,
			color: { argb: "FFFFFFFF" }, // 흰색 텍스트
		};

		// 테두리 설정
		cell.border = {
			top: { style: "thin", color: { argb: "FF000000" } },
			left: { style: "thin", color: { argb: "FF000000" } },
			bottom: { style: "thin", color: { argb: "FF000000" } },
			right: { style: "thin", color: { argb: "FF000000" } },
		};

		// 정렬 설정
		cell.alignment = {
			vertical: "middle",
			horizontal: "center",
			wrapText: true,
		};
	}

	/**
	 * 데이터 셀에 스타일을 적용합니다.
	 * @param cell - 스타일을 적용할 셀 객체
	 */
	styleDataCell(cell: Excel.Cell): void {
		// 폰트 설정
		cell.font = {
			name: "Arial",
			family: 2,
			size: 10,
			color: { argb: "FF000000" }, // 검은색 텍스트
		};

		// 테두리 설정
		cell.border = {
			top: { style: "thin", color: { argb: "FFD9D9D9" } },
			left: { style: "thin", color: { argb: "FFD9D9D9" } },
			bottom: { style: "thin", color: { argb: "FFD9D9D9" } },
			right: { style: "thin", color: { argb: "FFD9D9D9" } },
		};

		// 정렬 설정
		cell.alignment = {
			vertical: "middle",
			horizontal: "left",
			wrapText: true,
		};

		// 짝수 행 배경색 설정 (선택사항)
		if (typeof cell.row === "number" && cell.row % 2 === 0) {
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "FFF2F2F2" }, // 연한 회색 배경
			};
		}
	}

	/**
	 * 워크시트에 전체적인 스타일을 적용합니다.
	 * @param worksheet - 스타일을 적용할 워크시트
	 */
	styleWorksheet(worksheet: Excel.Worksheet): void {
		// 시트 전체 폰트 설정
		worksheet.views = [
			{
				state: "frozen",
				xSplit: 0,
				ySplit: 1, // 첫 번째 행 고정
				topLeftCell: "A2",
				activeCell: "A2",
			},
		];

		// 인쇄 설정
		worksheet.pageSetup = {
			orientation: "landscape",
			paperSize: 9, // A4
			fitToPage: true,
			fitToHeight: 1,
			fitToWidth: 1,
			margins: {
				left: 0.7,
				right: 0.7,
				top: 0.75,
				bottom: 0.75,
				header: 0.3,
				footer: 0.3,
			},
		};
	}
}
