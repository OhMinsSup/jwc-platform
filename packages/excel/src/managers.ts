import * as Excel from "exceljs";

import { ExcelHead } from "./head";
import { ExcelRowData } from "./rowData";
import { ExcelStyle } from "./style";
import type { GenerateExcelOptions } from "./types";

export class ExcelManagers {
	/** 현재 워크북 인스턴스 */
	private _workbook: Excel.Workbook | undefined;

	/** 시트 이름별 워크시트 인스턴스 맵 */
	private _sheet = new Map<string, Excel.Worksheet>();

	/** 헤더 유틸리티 인스턴스 */
	private _head = new ExcelHead();

	/** 행 데이터 유틸리티 인스턴스 */
	private _rowData = new ExcelRowData();

	/** 스타일 유틸리티 인스턴스 */
	private _style = new ExcelStyle();

	/**
	 * 새 워크북(Excel 파일)을 생성합니다.
	 * @returns 생성된 ExcelJS 워크북 객체
	 */
	createWorkbook(): Excel.Workbook {
		const workbook = new Excel.Workbook();
		this._workbook = workbook;
		return workbook;
	}

	/**
	 * 워크북에 새 시트를 생성하거나, 이미 있으면 기존 시트를 반환합니다.
	 * @param workbook - ExcelJS 워크북 객체
	 * @param sheetName - 시트 이름
	 * @returns 생성되거나 기존의 ExcelJS 워크시트 객체
	 * @throws 워크북이 생성되지 않은 경우 에러 발생
	 */
	createSheet(workbook: Excel.Workbook, sheetName: string): Excel.Worksheet {
		if (!this._workbook) {
			throw new Error("Workbook is not created");
		}

		if (this._sheet.has(sheetName)) {
			return this._sheet.get(sheetName) as unknown as Excel.Worksheet;
		}

		const sheet = workbook.addWorksheet(sheetName);
		this._sheet.set(sheetName, sheet);
		return sheet;
	}

	/**
	 * 시트에 헤더와 데이터 행을 추가하고 스타일을 적용합니다.
	 * @param options - Excel 생성 옵션
	 */
	generateExcel({ sheet, headers, rows }: GenerateExcelOptions): void {
		// 상단 헤더(TH) 추가
		const headerRow = sheet.addRow(headers.map((header) => header.name));
		// 헤더의 높이값 지정
		headerRow.height = 25;

		// 각 헤더 cell에 스타일 지정
		headerRow.eachCell((cell, colNum) => {
			this._style.styleHeaderCell(cell);
			sheet.getColumn(colNum).width = headers[colNum - 1]?.width;
		});

		// 각 Data cell에 데이터 삽입 및 스타일 지정
		rows.forEach((item, index) => {
			const rowDatas: (string | number)[] = [index + 1];
			// 순서를 제외한 나머지 헤더들
			const omitSequenceHeaders = headers.slice(1);
			for (const header of omitSequenceHeaders) {
				const key = header.name;
				rowDatas.push(item[key] ?? "");
			}
			const appendRow = sheet.addRow(rowDatas);

			appendRow.eachCell((cell) => {
				this._style.styleDataCell(cell);
			});
		});
	}

	/**
	 * 모든 워크시트를 워크북에서 제거합니다.
	 */
	destroySheet(): void {
		if (this._workbook && this._sheet.size > 0) {
			for (const [, sheet] of this._sheet) {
				this._workbook.removeWorksheetEx(sheet);
			}
		}
	}

	/**
	 * 워크북과 모든 워크시트 리소스를 해제합니다.
	 */
	destroyWorkbook(): void {
		this.destroySheet();
		this._workbook = undefined;
		this._sheet.clear();
	}

	/**
	 * 헤더 유틸리티 인스턴스를 반환합니다.
	 */
	get head(): ExcelHead {
		return this._head;
	}

	/**
	 * 행 데이터 유틸리티 인스턴스를 반환합니다.
	 */
	get rowData(): ExcelRowData {
		return this._rowData;
	}

	/**
	 * 스타일 유틸리티 인스턴스를 반환합니다.
	 */
	get style(): ExcelStyle {
		return this._style;
	}
}
