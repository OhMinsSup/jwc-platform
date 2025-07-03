import * as Excel from "exceljs";
import type {
	ExcelGenerateOptions,
	RowFormData,
	SpreadsheetHeaders,
} from "../core/types";
import { ExcelHeaderManager } from "./headers";
import { ExcelRowDataManager } from "./rowData";
import { ExcelStyleManager } from "./styler";

/**
 * Excel 파일 생성 및 관리 클래스
 * 워크북/시트 생성, 헤더/데이터 삽입, 스타일 적용, 리소스 해제 등 Excel 파일 작업을 지원합니다.
 */
export class ExcelManager {
	/** 현재 워크북 인스턴스 */
	private _workbook: Excel.Workbook | undefined;

	/** 현재 워크시트 인스턴스 */
	private _currentSheet: Excel.Worksheet | undefined;

	/** 헤더 관리자 인스턴스 */
	private _headerManager = new ExcelHeaderManager();

	/** 행 데이터 관리자 인스턴스 */
	private _rowDataManager = new ExcelRowDataManager();

	/** 스타일 관리자 인스턴스 */
	private _styleManager = new ExcelStyleManager();

	/**
	 * 새 워크북(Excel 파일)을 생성합니다.
	 * @returns 생성된 ExcelJS 워크북 객체
	 */
	createWorkbook(): Excel.Workbook {
		const workbook = new Excel.Workbook();
		workbook.creator = "JWC Form System";
		workbook.lastModifiedBy = "JWC Form System";
		workbook.created = new Date();
		workbook.modified = new Date();

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

		// 워크시트 전체 스타일 적용
		this._styleManager.styleWorksheet(sheet);

		return sheet;
	}

	/**
	 * 시트에 헤더와 데이터 행을 추가하고 스타일을 적용합니다.
	 * @param options - Excel 생성 옵션
	 */
	generateExcel({ sheet, headers, rows }: ExcelGenerateOptions): void {
		// 헤더 행 추가
		const headerRow = sheet.addRow(headers.map((header) => header.name));
		headerRow.height = 25;

		// 헤더 셀 스타일 적용
		headerRow.eachCell((cell, colNum) => {
			this._styleManager.styleHeaderCell(cell);
			sheet.getColumn(colNum).width = headers[colNum - 1]?.width || 15;
		});

		// 데이터 행 추가
		rows.forEach((item, index) => {
			const rowData: (string | number)[] = [index + 1];
			const omitSequenceHeaders = headers.slice(1);

			for (const header of omitSequenceHeaders) {
				const key = header.name as keyof RowFormData;
				rowData.push(item[key] ?? "");
			}

			const dataRow = sheet.addRow(rowData);
			dataRow.eachCell((cell) => {
				this._styleManager.styleDataCell(cell);
			});
		});

		// 자동 필터 적용
		if (rows.length > 0) {
			sheet.autoFilter = {
				from: { row: 1, column: 1 },
				to: { row: rows.length + 1, column: headers.length },
			};
		}
	}

	/**
	 * Form 데이터로 Excel을 생성합니다.
	 * @param docs - Form 데이터 배열
	 * @param sheetName - 시트 이름
	 * @returns 생성된 워크북
	 */
	generateFormExcel<T extends Record<string, unknown>>(
		docs: T[],
		sheetName = "수련회 신청서"
	): Excel.Workbook {
		const workbook = this.createWorkbook();
		const sheet = this.createSheet(workbook, sheetName);

		const headers = this._headerManager.createFormHeaders();
		const rows = this._rowDataManager.generateExcelFormRows(docs);

		this.generateExcel({ sheet, headers, rows });

		return workbook;
	}

	/**
	 * 워크북을 Buffer로 변환합니다.
	 * @param workbook - 변환할 워크북
	 * @returns Buffer 형태의 Excel 파일 데이터
	 */
	async writeToBuffer(workbook: Excel.Workbook): Promise<Buffer> {
		return (await workbook.xlsx.writeBuffer()) as Buffer;
	}

	/**
	 * 워크북을 파일로 저장합니다.
	 * @param workbook - 저장할 워크북
	 * @param filePath - 저장 경로
	 */
	async writeToFile(workbook: Excel.Workbook, filePath: string): Promise<void> {
		await workbook.xlsx.writeFile(filePath);
	}

	/**
	 * 현재 워크시트를 워크북에서 제거합니다.
	 */
	destroySheet(): void {
		if (this._workbook && this._currentSheet) {
			this._workbook.removeWorksheet(this._currentSheet.id);
		}
	}

	/**
	 * 워크북과 워크시트 리소스를 해제합니다.
	 */
	dispose(): void {
		this._currentSheet = undefined;
		this._workbook = undefined;
	}

	/**
	 * 헤더 관리자를 반환합니다.
	 */
	get headerManager(): ExcelHeaderManager {
		return this._headerManager;
	}

	/**
	 * 행 데이터 관리자를 반환합니다.
	 */
	get rowDataManager(): ExcelRowDataManager {
		return this._rowDataManager;
	}

	/**
	 * 스타일 관리자를 반환합니다.
	 */
	get styleManager(): ExcelStyleManager {
		return this._styleManager;
	}
}
