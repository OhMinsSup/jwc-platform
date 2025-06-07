import * as Excel from "exceljs";

import { ExcelHead } from "./head";
import { ExcelRowData } from "./rowData";
import { ExcelStyle } from "./style";
import type { ExcelHeader, ExcelHeaders, GenerateExcelOptions } from "./types";

/**
 * Excel 파일 생성 및 관리 유틸리티 클래스
 *
 * 워크북/시트 생성, 헤더/데이터 삽입, 스타일 적용, 리소스 해제 등 Excel 파일 작업을 지원합니다.
 */
export class ExcelManager {
	/** 현재 워크북 인스턴스 */
	private _workbook: Excel.Workbook | undefined;

	/** 현재 워크시트 인스턴스 */
	private _currentSheet: Excel.Worksheet | undefined;

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
	 * 워크북에 새 시트를 생성합니다.
	 * @param workbook - ExcelJS 워크북 객체
	 * @param sheetName - 시트 이름
	 * @returns 생성된 ExcelJS 워크시트 객체
	 * @throws 워크북이 생성되지 않은 경우 에러 발생
	 */
	createSheet(workbook: Excel.Workbook, sheetName: string): Excel.Worksheet {
		if (!this._workbook) {
			throw new Error("Workbook is not created");
		}

		const sheet = workbook.addWorksheet(sheetName);
		this._currentSheet = sheet;
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
	 * 현재 워크시트를 워크북에서 제거합니다.
	 */
	destroySheet(): void {
		if (this._workbook && this._currentSheet) {
			this._workbook.removeWorksheetEx(this._currentSheet);
		}
	}

	/**
	 * 워크북과 워크시트 리소스를 해제합니다.
	 */
	destroyWorkbook(): void {
		this.destroySheet();
		this._workbook = undefined;
		this._currentSheet = undefined;
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

	/**
	 * 주어진 데이터 배열을 기반으로 Excel 파일을 생성하고, 파일 버퍼(Buffer)를 반환합니다.
	 *
	 * @static
	 * @typeParam Data - Excel에 기록할 데이터 객체 타입 (Record<string, unknown> 기본값)
	 * @param name - 시트 이름(Excel 파일 내 시트명)
	 * @param docs - Excel로 변환할 데이터 객체 배열
	 * @returns 생성된 Excel 파일의 Buffer
	 *
	 * @example
	 * const buffer = await ExcelManager.buildExcelFileBuffer("Sheet1", dataArray);
	 */
	static async buildExcelFileBuffer<
		Data extends Record<string, unknown> = Record<string, unknown>,
	>(name: string, docs: Data[]): Promise<Buffer> {
		const excelManager = new ExcelManager();

		try {
			const workbook = excelManager.createWorkbook();
			const sheet = excelManager.createSheet(workbook, name);

			const headers = excelManager.head.createFormSheetHeaders();
			const rows = excelManager.rowData.generateExcelFormRows(docs);

			excelManager.generateExcel({
				workbook,
				sheet,
				headers,
				rows,
			});

			const buffer = await workbook.xlsx.writeBuffer();

			return buffer as Buffer;
		} finally {
			excelManager.destroyWorkbook();
		}
	}

	/**
	 * Google Sheets용 헤더 객체 배열을 생성합니다.
	 *
	 * 신청서 시트의 헤더 정보를 기반으로 Google Sheets에 적합한 헤더 배열을 반환합니다.
	 * (순서 컬럼 제외)
	 *
	 * @static
	 * @returns Google Sheets용 ExcelHeaders 배열
	 *
	 * @example
	 * const headers = ExcelManager.createFormGoogleSheetHeaders();
	 */
	static createFormGoogleSheetHeaders(): ExcelHeaders {
		return new ExcelHead().createFormGoogleSheetHeaders();
	}

	/**
	 * 주어진 이름(name)에 해당하는 ExcelHeader 객체를 반환합니다.
	 *
	 * @param name - 찾고자 하는 헤더의 이름
	 * @returns 일치하는 ExcelHeader 객체 또는 undefined
	 *
	 * @example
	 * const header = ExcelManager.findHeaderByName("이름");
	 * if (header) {
	 *   console.log(header.key); // "name"
	 * }
	 */
	static findHeaderByName(name: string): ExcelHeader | undefined {
		return new ExcelHead().findHeaderByName(name);
	}
}
