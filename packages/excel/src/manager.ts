import * as Excel from "exceljs";

import { ExcelHead } from "./head";
import { ExcelRowData } from "./rowData";
import { ExcelStyle } from "./style";

interface GenerateExcelOptions<Row = Record<string, string | number>> {
	workbook: Excel.Workbook;
	sheet: Excel.Worksheet;
	headers: { name: string; width: number }[];
	rows: Row[];
}

export class ExcelManager {
	private _workbook: Excel.Workbook | undefined;

	private _currentSheet: Excel.Worksheet | undefined;

	private _head = new ExcelHead();

	private _rowData = new ExcelRowData();

	private _style = new ExcelStyle();

	createWorkbook() {
		const workbook = new Excel.Workbook();
		this._workbook = workbook;
		return workbook;
	}

	createSheet(workbook: Excel.Workbook, sheetName: string) {
		if (!this._workbook) {
			throw new Error("Workbook is not created");
		}

		const sheet = workbook.addWorksheet(sheetName);
		this._currentSheet = sheet;
		return sheet;
	}

	generateExcel({ sheet, headers, rows }: GenerateExcelOptions) {
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

	destroySheet() {
		if (this._workbook && this._currentSheet) {
			this._workbook.removeWorksheetEx(this._currentSheet);
		}
	}

	destroyWorkbook() {
		this.destroySheet();
		this._workbook = undefined;
		this._currentSheet = undefined;
	}

	get head() {
		return this._head;
	}

	get rowData() {
		return this._rowData;
	}

	get style() {
		return this._style;
	}
}
