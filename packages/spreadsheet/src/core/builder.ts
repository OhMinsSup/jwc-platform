import { SpreadsheetManager } from "./manager";
import type { RowFormData, SpreadsheetConfig } from "./types";

/**
 * 간편한 스프레드시트 빌더 클래스
 * 체이닝 방식으로 스프레드시트 작업을 쉽게 설정할 수 있습니다.
 *
 * @template T - 관리할 데이터 타입
 */
export class SpreadsheetBuilder<
	T extends Record<string, unknown> = RowFormData,
> {
	private manager: SpreadsheetManager<T>;

	constructor() {
		this.manager = new SpreadsheetManager<T>();
	}

	/**
	 * 데이터를 설정합니다.
	 * @param data - 설정할 데이터 배열
	 * @returns this (체이닝 지원)
	 */
	withData(data: T[]): this {
		this.manager.setData(data);
		return this;
	}

	/**
	 * Excel 내보내기를 설정합니다.
	 * @param fileName - 파일명
	 * @param sheetName - 시트명 (기본값: "Sheet1")
	 * @param enableStyling - 스타일 적용 여부 (기본값: true)
	 * @returns this (체이닝 지원)
	 */
	withExcel(
		fileName: string,
		sheetName = "Sheet1",
		enableStyling = true
	): this {
		this.manager.enableExcelExport({
			fileName,
			sheetName,
			enableStyling,
		});
		return this;
	}

	/**
	 * Google Sheets 동기화를 설정합니다.
	 * @param spreadsheetId - 스프레드시트 ID
	 * @param sheetName - 시트명
	 * @param clientEmail - 클라이언트 이메일
	 * @param privateKey - 개인 키
	 * @returns this (체이닝 지원)
	 */
	withGoogleSheets(
		spreadsheetId: string,
		sheetName: string,
		clientEmail: string,
		privateKey: string
	): this {
		this.manager.enableGoogleSync({
			spreadsheetId,
			sheetName,
			clientEmail,
			privateKey,
		});
		return this;
	}

	/**
	 * 환경 변수에서 Google Sheets 설정을 읽어 설정합니다.
	 * @param sheetName - 시트명 (선택사항)
	 * @returns this (체이닝 지원)
	 */
	withGoogleSheetsFromEnv(sheetName?: string): this {
		const spreadsheetId = process.env.GOOGLE_SHEET_ID;
		const defaultSheetName = process.env.GOOGLE_SHEET_TITLE || "Sheet1";
		const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
		const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

		if (!spreadsheetId || !clientEmail || !privateKey) {
			throw new Error(
				"환경 변수에서 Google Sheets 설정을 찾을 수 없습니다. GOOGLE_SHEET_ID, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY가 필요합니다."
			);
		}

		return this.withGoogleSheets(
			spreadsheetId,
			sheetName || defaultSheetName,
			clientEmail,
			privateKey
		);
	}

	/**
	 * 설정을 검증합니다.
	 * @returns 검증 결과
	 */
	validate(): { isValid: boolean; errors: string[] } {
		return this.manager.validate();
	}

	/**
	 * Excel 파일을 생성합니다.
	 * @returns Excel 워크북
	 */
	async buildExcel() {
		return await this.manager.generateExcel();
	}

	/**
	 * Excel Buffer를 생성합니다.
	 * @returns Excel 파일 Buffer
	 */
	async buildExcelBuffer(): Promise<Buffer> {
		return await this.manager.exportExcelBuffer();
	}

	/**
	 * Google Sheets에 동기화합니다.
	 */
	async syncGoogle(): Promise<void> {
		await this.manager.syncToGoogle();
	}

	/**
	 * 모든 작업을 실행합니다.
	 * @returns 실행 결과
	 */
	async execute() {
		return await this.manager.executeAll();
	}

	/**
	 * 리소스를 정리합니다.
	 */
	dispose(): void {
		this.manager.dispose();
	}

	/**
	 * 내부 관리자 인스턴스를 반환합니다.
	 * @returns SpreadsheetManager 인스턴스
	 */
	getManager(): SpreadsheetManager<T> {
		return this.manager;
	}
}

/**
 * 간편한 팩토리 함수들
 */

/**
 * 새 스프레드시트 빌더를 생성합니다.
 * @returns SpreadsheetBuilder 인스턴스
 */
export function createSpreadsheet<
	T extends Record<string, unknown> = RowFormData,
>(): SpreadsheetBuilder<T> {
	return new SpreadsheetBuilder<T>();
}

/**
 * Form 데이터 전용 빌더를 생성합니다.
 * @returns Form 데이터용 SpreadsheetBuilder 인스턴스
 */
export function createFormSpreadsheet(): SpreadsheetBuilder<RowFormData> {
	return new SpreadsheetBuilder<RowFormData>();
}
