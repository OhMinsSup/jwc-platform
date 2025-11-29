/**
 * @fileoverview Excel 빌더 구현
 *
 * 스키마 기반으로 Excel 파일을 생성하는 빌더 패턴 구현입니다.
 * ExcelJS를 사용하여 스프레드시트를 생성합니다.
 */

import ExcelJS from "exceljs";
import type { IColumnDefinition, ISpreadsheetSchema } from "../core/interfaces";
import { SchemaBasedTransformer } from "../core/transformer";

// ============================================================================
// 스타일 설정 상수
// ============================================================================

const STYLES = {
	header: {
		font: { bold: true, color: { argb: "FFFFFFFF" }, size: 11 },
		fill: {
			type: "pattern" as const,
			pattern: "solid" as const,
			fgColor: { argb: "FF4472C4" },
		},
		border: {
			top: { style: "thin" as const, color: { argb: "FF000000" } },
			left: { style: "thin" as const, color: { argb: "FF000000" } },
			bottom: { style: "thin" as const, color: { argb: "FF000000" } },
			right: { style: "thin" as const, color: { argb: "FF000000" } },
		},
		alignment: { vertical: "middle" as const, horizontal: "center" as const },
	},
	cell: {
		font: { size: 10 },
		border: {
			top: { style: "thin" as const, color: { argb: "FFD9D9D9" } },
			left: { style: "thin" as const, color: { argb: "FFD9D9D9" } },
			bottom: { style: "thin" as const, color: { argb: "FFD9D9D9" } },
			right: { style: "thin" as const, color: { argb: "FFD9D9D9" } },
		},
		alignment: { vertical: "middle" as const, wrapText: true },
	},
	alternateRow: {
		fill: {
			type: "pattern" as const,
			pattern: "solid" as const,
			fgColor: { argb: "FFF8F8F8" },
		},
	},
} as const;

// ============================================================================
// Excel 스타일러 구현
// ============================================================================

/**
 * Excel 셀 스타일 관리자
 */
export class ExcelStyler {
	private readonly worksheet: ExcelJS.Worksheet;

	constructor(worksheet: ExcelJS.Worksheet) {
		this.worksheet = worksheet;
	}

	/**
	 * 헤더 행에 스타일 적용
	 */
	applyHeaderStyle(row: number): void {
		const headerRow = this.worksheet.getRow(row);
		headerRow.eachCell({ includeEmpty: true }, (cell) => {
			cell.font = STYLES.header.font;
			cell.fill = STYLES.header.fill;
			cell.border = STYLES.header.border;
			cell.alignment = STYLES.header.alignment;
		});
		headerRow.height = 25;
	}

	/**
	 * 데이터 셀에 스타일 적용
	 */
	applyCellStyle(row: number, column: number): void {
		const cell = this.worksheet.getCell(row, column);
		cell.font = STYLES.cell.font;
		cell.border = STYLES.cell.border;
		cell.alignment = STYLES.cell.alignment;
	}

	/**
	 * 교차 행 배경색 적용
	 */
	applyAlternateRowStyle(row: number): void {
		const dataRow = this.worksheet.getRow(row);
		dataRow.eachCell({ includeEmpty: true }, (cell) => {
			cell.fill = STYLES.alternateRow.fill;
		});
	}

	/**
	 * 컬럼 너비 설정
	 */
	setColumnWidth(column: number, width: number): void {
		this.worksheet.getColumn(column).width = width;
	}

	/**
	 * 필터 적용
	 */
	applyAutoFilter(startRow: number, endRow: number, endColumn: number): void {
		this.worksheet.autoFilter = {
			from: { row: startRow, column: 1 },
			to: { row: endRow, column: endColumn },
		};
	}

	/**
	 * 행 고정
	 */
	freezeRows(rowCount: number): void {
		this.worksheet.views = [{ state: "frozen", ySplit: rowCount }];
	}
}

// ============================================================================
// Excel 빌더 구현
// ============================================================================

/**
 * 스키마 기반 Excel 빌더
 * 스키마에 따라 Excel 파일을 생성합니다.
 */
export class ExcelBuilder<T = Record<string, unknown>> {
	private readonly workbook: ExcelJS.Workbook;
	private readonly schema: ISpreadsheetSchema<T>;
	private readonly transformer: SchemaBasedTransformer<T>;
	private activeSheet: ExcelJS.Worksheet | null = null;

	constructor(schema: ISpreadsheetSchema<T>) {
		this.workbook = new ExcelJS.Workbook();
		this.schema = schema;
		this.transformer = new SchemaBasedTransformer(schema);
		this.initializeWorkbook();
	}

	/**
	 * 워크북 초기화
	 */
	private initializeWorkbook(): void {
		this.workbook.creator = "JWC Form System";
		this.workbook.created = new Date();
		this.workbook.modified = new Date();
	}

	/**
	 * 새 시트 생성
	 */
	createSheet(name?: string): this {
		const sheetName = name || this.schema.defaultSheetName || "Sheet1";
		// 이미 존재하는 시트 이름이면 고유한 이름 생성
		let finalName = sheetName;
		let counter = 1;
		while (this.workbook.getWorksheet(finalName)) {
			finalName = `${sheetName}_${counter}`;
			counter += 1;
		}
		this.activeSheet = this.workbook.addWorksheet(finalName);
		return this;
	}

	/**
	 * 헤더 행 추가
	 */
	addHeaders(): this {
		if (!this.activeSheet) {
			this.createSheet();
		}

		const sheet = this.activeSheet;
		if (!sheet) {
			throw new Error("Worksheet not initialized");
		}

		const headers = this.transformer.getHeaders();
		const styler = new ExcelStyler(sheet);

		// 헤더 행 추가
		const headerRow = sheet.addRow(headers);

		// 스타일 적용
		styler.applyHeaderStyle(headerRow.number);

		// 컬럼 너비 설정
		this.schema.columns.forEach((col: IColumnDefinition<T>, index: number) => {
			const width = col.width ?? this.calculateColumnWidth(col.header);
			styler.setColumnWidth(index + 1, width);
		});

		// 첫 행 고정
		styler.freezeRows(1);

		return this;
	}

	/**
	 * 데이터 행 추가
	 */
	addRows(data: T[]): this {
		if (!this.activeSheet) {
			this.createSheet().addHeaders();
		}

		const sheet = this.activeSheet;
		if (!sheet) {
			throw new Error("Worksheet not initialized");
		}

		const styler = new ExcelStyler(sheet);
		const transformedData = this.transformer.transformMany(data);

		transformedData.forEach(
			(rowData: Record<string, string>, index: number) => {
				// 스키마 순서대로 값 배열 생성
				const values = this.schema.columns.map(
					(col: IColumnDefinition<T>) => rowData[col.header] || ""
				);
				const row = sheet.addRow(values);

				// 셀 스타일 적용
				row.eachCell({ includeEmpty: true }, (_, colNumber) => {
					styler.applyCellStyle(row.number, colNumber);
				});

				// 교차 행 배경색
				if (index % 2 === 1) {
					styler.applyAlternateRowStyle(row.number);
				}
			}
		);

		// 자동 필터 적용
		if (data.length > 0) {
			const lastRow = (sheet.lastRow?.number || 1) + 1;
			styler.applyAutoFilter(1, lastRow, this.schema.columns.length);
		}

		return this;
	}

	/**
	 * 드롭다운 검증 추가
	 */
	addValidation(column: number, options: string[]): this {
		if (!this.activeSheet) {
			return this;
		}

		const columnLetter = this.getColumnLetter(column);
		const lastRow = this.activeSheet.lastRow?.number || 1;

		// 데이터 검증 적용
		for (let row = 2; row <= lastRow; row++) {
			const cell = this.activeSheet.getCell(`${columnLetter}${row}`);
			cell.dataValidation = {
				type: "list",
				allowBlank: true,
				formulae: [`"${options.join(",")}"`],
				showErrorMessage: true,
				errorTitle: "올바르지 않은 값",
				error: `다음 중 하나를 선택하세요: ${options.join(", ")}`,
			};
		}

		return this;
	}

	/**
	 * 컬럼 문자 반환 (1 -> A, 2 -> B, ...)
	 */
	private getColumnLetter(column: number): string {
		let result = "";
		let col = column;
		while (col > 0) {
			const remainder = (col - 1) % 26;
			result = String.fromCharCode(65 + remainder) + result;
			col = Math.floor((col - 1) / 26);
		}
		return result;
	}

	/**
	 * 컬럼 너비 계산
	 */
	private calculateColumnWidth(header: string): number {
		const length = header.length;
		// 한글은 2배 너비
		const koreanChars = (header.match(/[가-힣]/g) || []).length;
		return Math.max(10, length + koreanChars * 0.5 + 4);
	}

	/**
	 * Buffer로 변환
	 */
	async toBuffer(): Promise<Buffer> {
		const arrayBuffer = await this.workbook.xlsx.writeBuffer();
		return Buffer.from(arrayBuffer);
	}

	/**
	 * 파일로 저장
	 */
	async toFile(filePath: string): Promise<void> {
		await this.workbook.xlsx.writeFile(filePath);
	}

	/**
	 * 워크북 반환
	 */
	getWorkbook(): ExcelJS.Workbook {
		return this.workbook;
	}
}

// ============================================================================
// 팩토리 함수
// ============================================================================

/**
 * Excel 빌더 생성 팩토리 함수
 */
export function createExcelBuilder<T = Record<string, unknown>>(
	schema: ISpreadsheetSchema<T>
): ExcelBuilder<T> {
	return new ExcelBuilder(schema);
}

/**
 * 데이터와 스키마로 Excel 버퍼 빠르게 생성
 */
export async function createExcelBuffer<T = Record<string, unknown>>(
	schema: ISpreadsheetSchema<T>,
	data: T[]
): Promise<Buffer> {
	const builder = new ExcelBuilder(schema);
	const result = await builder
		.createSheet()
		.addHeaders()
		.addRows(data)
		.toBuffer();
	return result;
}
