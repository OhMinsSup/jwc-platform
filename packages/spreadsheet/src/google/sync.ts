import type { SpreadsheetHeaders } from "../core/types";
import { env } from "../env";
import { ExcelHeaderManager } from "../excel/headers";
import { ExcelRowDataManager } from "../excel/rowData";
import { googleApiClient } from "./client";

/**
 * Google Sheets Table 타입 정의
 */
interface GoogleSheetsTable {
	tableId?: string | null;
	name?: string | null;
	range?: {
		sheetId?: number | null;
		startRowIndex?: number | null;
		endRowIndex?: number | null;
		startColumnIndex?: number | null;
		endColumnIndex?: number | null;
	} | null;
}

/**
 * Google Sheets 동기화 관리자 클래스
 * Google Sheets에 데이터를 생성/업데이트하는 기능을 제공합니다.
 */
export class GoogleSheetsSyncManager<T extends Record<string, unknown>> {
	/** 시트 이름 */
	private sheetName: string;

	/** 스프레드시트 ID */
	private spreadsheetId: string;

	/** 시트에 입력할 데이터 배열 */
	private docs: T[] = [];

	/** 헤더 관리자 */
	private headerManager = new ExcelHeaderManager();

	/** 행 데이터 관리자 */
	private rowDataManager = new ExcelRowDataManager();

	/**
	 * Google Sheets 동기화 관리자를 생성합니다.
	 * @param options - 초기 설정 옵션
	 */
	constructor(options?: {
		sheetName?: string;
		spreadsheetId?: string;
	}) {
		this.sheetName = options?.sheetName || env.GOOGLE_SHEET_TITLE;
		this.spreadsheetId = options?.spreadsheetId || env.GOOGLE_SHEET_ID;
	}

	/**
	 * 시트 이름을 설정합니다.
	 * @param name - 시트 이름
	 * @returns this (체이닝 지원)
	 */
	setSheetName(name: string): this {
		this.sheetName = name;
		return this;
	}

	/**
	 * 스프레드시트 ID를 설정합니다.
	 * @param id - 스프레드시트 ID
	 * @returns this (체이닝 지원)
	 */
	setSpreadsheetId(id: string): this {
		this.spreadsheetId = id;
		return this;
	}

	/**
	 * 시트에 입력할 데이터를 설정합니다.
	 * @param docs - 데이터 배열
	 * @returns this (체이닝 지원)
	 */
	setDocs(docs: T[]): this {
		this.docs = docs;
		return this;
	}

	/**
	 * 시트의 메타데이터(시트 ID, 테이블 정보)를 조회합니다.
	 * @returns 시트 ID와 테이블 정보 객체
	 * @private
	 */
	private async getSheetMeta() {
		const res = await googleApiClient.sheets.spreadsheets.get({
			spreadsheetId: this.spreadsheetId,
			fields: "sheets.properties,sheets.tables",
		});

		const sheet = res.data.sheets?.find(
			(s) => s.properties?.title === this.sheetName
		);

		return {
			sheetId: sheet?.properties?.sheetId ?? null,
			table: sheet?.tables?.[0] ?? null,
		};
	}

	/**
	 * 시트가 없으면 새로 생성하고, 있으면 시트 ID를 반환합니다.
	 * @returns 시트 ID
	 * @private
	 */
	private async ensureSheet(): Promise<number> {
		const { sheetId } = await this.getSheetMeta();
		if (sheetId !== null) return sheetId;

		const res = await googleApiClient.sheets.spreadsheets.batchUpdate({
			spreadsheetId: this.spreadsheetId,
			requestBody: {
				requests: [
					{
						addSheet: {
							properties: {
								title: this.sheetName,
								gridProperties: {
									rowCount: 1000,
									columnCount: 26,
								},
							},
						},
					},
				],
			},
		});

		return res.data.replies?.[0]?.addSheet?.properties?.sheetId as number;
	}

	/**
	 * 시트 데이터를 클리어합니다.
	 * @private
	 */
	private async clearSheetData(): Promise<void> {
		await googleApiClient.sheets.spreadsheets.values.clear({
			spreadsheetId: this.spreadsheetId,
			range: `${this.sheetName}`,
		});
	}

	/**
	 * 시트에 데이터를 업데이트합니다.
	 * @param headers - 헤더 배열
	 * @param rows - 데이터 행 배열
	 * @private
	 */
	private async updateSheetData(
		headers: string[],
		rows: string[][]
	): Promise<void> {
		await googleApiClient.sheets.spreadsheets.values.update({
			spreadsheetId: this.spreadsheetId,
			range: `${this.sheetName}!A1`,
			valueInputOption: "USER_ENTERED",
			requestBody: {
				values: [headers, ...rows],
			},
		});
	}

	/**
	 * Google Sheets 테이블을 생성하거나 업데이트합니다.
	 * @param sheetId - 시트 ID
	 * @param headerValues - 헤더 정보
	 * @param rowCount - 행 개수
	 * @param table - 기존 테이블 정보 (선택사항)
	 * @private
	 */
	private async upsertTable(
		sheetId: number,
		headerValues: SpreadsheetHeaders,
		rowCount: number,
		table?: GoogleSheetsTable
	): Promise<void> {
		const tableRequest = table
			? {
					updateTable: {
						table: {
							tableId: table.tableId,
							name: this.sheetName,
							range: {
								sheetId,
								startRowIndex: 0,
								endRowIndex: rowCount + 1,
								startColumnIndex: 0,
								endColumnIndex: headerValues.length,
							},
							columnProperties: headerValues.map((header, idx) => ({
								columnName: header.name,
								columnType: header.columnType,
								columnIndex: idx,
								...(header.columnType === "DROPDOWN" &&
									header.options && {
										dataValidationRule: {
											condition: {
												type: "ONE_OF_LIST",
												values: header.options.map((option) => ({
													userEnteredValue: option,
												})),
											},
										},
									}),
							})),
						},
						fields: "*",
					},
				}
			: {
					addTable: {
						table: {
							name: this.sheetName,
							range: {
								sheetId,
								startRowIndex: 0,
								endRowIndex: rowCount + 1,
								startColumnIndex: 0,
								endColumnIndex: headerValues.length,
							},
							columnProperties: headerValues.map((header, idx) => ({
								columnName: header.name,
								columnType: header.columnType,
								columnIndex: idx,
								...(header.columnType === "DROPDOWN" &&
									header.options && {
										dataValidationRule: {
											condition: {
												type: "ONE_OF_LIST",
												values: header.options.map((option) => ({
													userEnteredValue: option,
												})),
											},
										},
									}),
							})),
						},
					},
				};

		await googleApiClient.sheets.spreadsheets.batchUpdate({
			spreadsheetId: this.spreadsheetId,
			requestBody: { requests: [tableRequest] },
		});
	}

	/**
	 * Google Sheets에 테이블(표) 데이터를 생성 또는 업데이트합니다.
	 * 시트가 없으면 생성하고, 기존 데이터는 모두 삭제 후 새 데이터로 덮어씁니다.
	 */
	async syncToGoogleSheets(): Promise<void> {
		if (this.docs.length === 0) {
			throw new Error(
				"동기화할 데이터가 없습니다. setDocs()를 먼저 호출하세요."
			);
		}

		try {
			// 헤더와 행 데이터 생성
			const headerValues = this.headerManager.createGoogleSheetHeaders();
			const headers = headerValues.map((header) => header.name);
			const rowValues = this.rowDataManager.generateExcelFormRows(this.docs);
			const rows = rowValues.map((row) =>
				headers.map((header) => String(row[header as keyof typeof row] ?? ""))
			);

			// 시트 생성 또는 조회
			const { sheetId, table } = await this.getSheetMeta();
			let realSheetId = sheetId;

			if (realSheetId === null) {
				realSheetId = await this.ensureSheet();
			}

			// 데이터 클리어 후 업데이트
			await this.clearSheetData();
			await this.updateSheetData(headers, rows);

			// 테이블 생성 또는 업데이트
			await this.upsertTable(
				realSheetId,
				headerValues,
				rows.length,
				table || undefined
			);
		} catch (error) {
			console.error("Google Sheets 동기화 오류:", error);
			throw new Error(
				`Google Sheets 동기화에 실패했습니다: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}
}
