import type * as Excel from "exceljs";
import { ExcelManager } from "../excel/manager";
import { GoogleSheetsSyncManager } from "../google/sync";
import { DataConverter } from "../utils/converter";
import {
	isEmpty,
	validateRowFormData,
	validateSpreadsheetConfig,
} from "../utils/validator";
import type {
	ExcelExportConfig,
	GoogleSheetsConfig,
	RowFormData,
	SpreadsheetConfig,
	SpreadsheetData,
} from "./types";

/**
 * 통합 스프레드시트 관리자 클래스
 * Excel 파일 생성과 Google Sheets 동기화를 통합 관리합니다.
 *
 * @template T - 관리할 데이터 타입
 *
 * @example
 * ```typescript
 * const manager = new SpreadsheetManager<FormData>()
 *   .setData(formData)
 *   .enableGoogleSync({
 *     spreadsheetId: 'sheet-id',
 *     sheetName: 'Forms',
 *     clientEmail: 'client@email.com',
 *     privateKey: 'private-key'
 *   })
 *   .enableExcelExport({
 *     fileName: 'forms.xlsx',
 *     sheetName: 'Forms',
 *     enableStyling: true
 *   });
 *
 * await manager.executeAll();
 * ```
 */
export class SpreadsheetManager<
	T extends Record<string, unknown> = RowFormData,
> {
	/** 관리할 데이터 배열 */
	private data: T[] = [];

	/** Excel 관리자 인스턴스 */
	private excelManager: ExcelManager | null = null;

	/** Google Sheets 동기화 관리자 인스턴스 */
	private googleSyncManager: GoogleSheetsSyncManager<T> | null = null;

	/** Excel 설정 */
	private excelConfig: ExcelExportConfig | null = null;

	/** Google Sheets 설정 */
	private googleConfig: GoogleSheetsConfig | null = null;

	/** 생성된 Excel 워크북 */
	private workbook: Excel.Workbook | null = null;

	/**
	 * 관리할 데이터를 설정합니다.
	 * @param data - 설정할 데이터 배열
	 * @returns this (체이닝 지원)
	 */
	setData(data: T[]): this {
		if (isEmpty(data)) {
			throw new Error("데이터가 비어있습니다.");
		}
		this.data = [...data]; // 얕은 복사로 원본 데이터 보호
		return this;
	}

	/**
	 * Google Sheets 동기화를 활성화합니다.
	 * @param config - Google Sheets 설정
	 * @returns this (체이닝 지원)
	 */
	enableGoogleSync(config: GoogleSheetsConfig): this {
		this.googleConfig = config;
		this.googleSyncManager = new GoogleSheetsSyncManager<T>({
			sheetName: config.sheetName,
			spreadsheetId: config.spreadsheetId,
		});
		return this;
	}

	/**
	 * Excel 내보내기를 활성화합니다.
	 * @param config - Excel 내보내기 설정
	 * @returns this (체이닝 지원)
	 */
	enableExcelExport(config: ExcelExportConfig): this {
		this.excelConfig = config;
		this.excelManager = new ExcelManager();
		return this;
	}

	/**
	 * 설정된 기능들을 검증합니다.
	 * @returns 검증 결과
	 */
	validate(): { isValid: boolean; errors: string[] } {
		const errors: string[] = [];

		// 데이터 검증
		if (isEmpty(this.data)) {
			errors.push("데이터가 설정되지 않았습니다. setData()를 먼저 호출하세요.");
		}

		// 설정 검증
		const config: SpreadsheetConfig = {
			excel: this.excelConfig || undefined,
			google: this.googleConfig || undefined,
		};

		const configValidation = validateSpreadsheetConfig(config);
		if (!configValidation.isValid) {
			errors.push(...configValidation.errors);
		}

		// 데이터 유효성 검증 (RowFormData로 변환 가능한지 확인)
		if (!isEmpty(this.data)) {
			try {
				const convertedData = DataConverter.toRowFormDataArray(this.data);
				const dataValidation = validateRowFormData(convertedData);
				if (!dataValidation.isValid && dataValidation.errors.length > 0) {
					errors.push(
						`데이터 검증 오류: ${dataValidation.errors.slice(0, 5).join(", ")}${dataValidation.errors.length > 5 ? " ..." : ""}`
					);
				}
			} catch (error) {
				errors.push(
					`데이터 변환 오류: ${error instanceof Error ? error.message : String(error)}`
				);
			}
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Excel 파일을 생성합니다.
	 * @returns 생성된 Excel 워크북
	 */
	async generateExcel(): Promise<Excel.Workbook> {
		const validation = this.validate();
		if (!validation.isValid) {
			throw new Error(`검증 오류: ${validation.errors.join(", ")}`);
		}

		if (!this.excelManager || !this.excelConfig) {
			throw new Error(
				"Excel 내보내기가 활성화되지 않았습니다. enableExcelExport()를 먼저 호출하세요."
			);
		}

		try {
			const convertedData = DataConverter.toRowFormDataArray(this.data);
			this.workbook = this.excelManager.generateFormExcel(
				convertedData,
				this.excelConfig.sheetName
			);
			return this.workbook;
		} catch (error) {
			throw new Error(
				`Excel 생성 오류: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	/**
	 * Excel 파일을 Buffer로 내보냅니다.
	 * @returns Excel 파일 Buffer
	 */
	async exportExcelBuffer(): Promise<Buffer> {
		if (!this.workbook) {
			await this.generateExcel();
		}

		if (!this.workbook || !this.excelManager) {
			throw new Error("Excel 워크북이 생성되지 않았습니다.");
		}

		return await this.excelManager.writeToBuffer(this.workbook);
	}

	/**
	 * Excel 파일을 파일 시스템에 저장합니다.
	 * @param filePath - 저장할 파일 경로 (선택사항, 기본값: 설정된 파일명)
	 */
	async saveExcelFile(filePath?: string): Promise<void> {
		if (!this.workbook) {
			await this.generateExcel();
		}

		if (!this.workbook || !this.excelManager || !this.excelConfig) {
			throw new Error("Excel 워크북이 생성되지 않았습니다.");
		}

		const finalPath = filePath || this.excelConfig.fileName;
		await this.excelManager.writeToFile(this.workbook, finalPath);
	}

	/**
	 * Google Sheets에 데이터를 동기화합니다.
	 */
	async syncToGoogle(): Promise<void> {
		const validation = this.validate();
		if (!validation.isValid) {
			throw new Error(`검증 오류: ${validation.errors.join(", ")}`);
		}

		if (!this.googleSyncManager) {
			throw new Error(
				"Google Sheets 동기화가 활성화되지 않았습니다. enableGoogleSync()를 먼저 호출하세요."
			);
		}

		try {
			await this.googleSyncManager.setDocs(this.data).syncToGoogleSheets();
		} catch (error) {
			throw new Error(
				`Google Sheets 동기화 오류: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	/**
	 * 모든 활성화된 기능을 실행합니다.
	 * Excel 생성과 Google Sheets 동기화를 모두 수행합니다.
	 * @returns 실행 결과 객체
	 */
	async executeAll(): Promise<{
		excel?: {
			workbook: Excel.Workbook;
			buffer: Buffer;
		};
		google?: {
			success: boolean;
		};
	}> {
		const validation = this.validate();
		if (!validation.isValid) {
			throw new Error(`검증 오류: ${validation.errors.join(", ")}`);
		}

		const results: Awaited<ReturnType<SpreadsheetManager<T>["executeAll"]>> =
			{};

		// Excel 생성
		if (this.excelConfig && this.excelManager) {
			try {
				const workbook = await this.generateExcel();
				const buffer = await this.exportExcelBuffer();
				results.excel = { workbook, buffer };
			} catch (error) {
				throw new Error(
					`Excel 처리 중 오류: ${error instanceof Error ? error.message : String(error)}`
				);
			}
		}

		// Google Sheets 동기화
		if (this.googleConfig && this.googleSyncManager) {
			try {
				await this.syncToGoogle();
				results.google = { success: true };
			} catch (error) {
				throw new Error(
					`Google Sheets 처리 중 오류: ${error instanceof Error ? error.message : String(error)}`
				);
			}
		}

		return results;
	}

	/**
	 * 리소스를 정리합니다.
	 */
	dispose(): void {
		this.data = [];
		this.workbook = null;

		if (this.excelManager) {
			this.excelManager.dispose();
			this.excelManager = null;
		}

		this.googleSyncManager = null;
		this.excelConfig = null;
		this.googleConfig = null;
	}

	/**
	 * 현재 설정된 데이터 개수를 반환합니다.
	 */
	get dataCount(): number {
		return this.data.length;
	}

	/**
	 * Excel 내보내기 활성화 여부를 반환합니다.
	 */
	get isExcelEnabled(): boolean {
		return this.excelConfig !== null && this.excelManager !== null;
	}

	/**
	 * Google Sheets 동기화 활성화 여부를 반환합니다.
	 */
	get isGoogleSyncEnabled(): boolean {
		return this.googleConfig !== null && this.googleSyncManager !== null;
	}
}
