import { ExcelManager } from "@jwc/excel";
import { env } from "./env";
import { googleApiClient } from "./googleApiClient";

/**
 * Google Sheets 데이터 빌더 (Builder 패턴)
 *
 * Google Sheets에 데이터를 생성/업데이트하는 기능을 제공합니다.
 *
 * @template T - 시트에 입력할 데이터 타입
 */
export class GoogleSheetBuilder<T extends Record<string, unknown>> {
	/** 시트 이름 */
	private sheetName: string = env.GOOGLE_SHEET_TITLE;
	/** 시트에 입력할 데이터 배열 */
	private docs: T[] = [];

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
			spreadsheetId: env.GOOGLE_SHEET_ID,
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
			spreadsheetId: env.GOOGLE_SHEET_ID,
			requestBody: {
				requests: [{ addSheet: { properties: { title: this.sheetName } } }],
			},
		});
		return res.data.replies?.[0]?.addSheet?.properties?.sheetId as number;
	}

	/**
	 * Google Sheets에 테이블(표) 데이터를 생성 또는 업데이트합니다.
	 *
	 * @remarks
	 * - 시트가 없으면 생성하고, 기존 데이터는 모두 삭제 후 새 데이터로 덮어씁니다.
	 * - Google Sheets의 표(테이블) 구조도 함께 생성/업데이트합니다.
	 */
	async upsertGoogleSheetTable(): Promise<void> {
		const $excel = new ExcelManager();
		const headerValues = $excel.head.createFormGoogleSheetHeaders();
		const headers = headerValues.map((header) => header.name);
		const rowValues = $excel.rowData.generateExcelFormRows(this.docs);
		const rows = rowValues.map((row) =>
			headers.map((header) => row[header as keyof typeof row] ?? "")
		);

		// 시트 생성 또는 조회
		const { sheetId, table } = await this.getSheetMeta();
		let realSheetId = sheetId;
		if (realSheetId === null) {
			realSheetId = await this.ensureSheet();
		}

		// 데이터 클리어
		await googleApiClient.sheets.spreadsheets.values.clear({
			spreadsheetId: env.GOOGLE_SHEET_ID,
			range: `${this.sheetName}`,
		});

		// 데이터 입력
		await googleApiClient.sheets.spreadsheets.values.update({
			spreadsheetId: env.GOOGLE_SHEET_ID,
			range: `${this.sheetName}!A1`,
			valueInputOption: "USER_ENTERED",
			requestBody: {
				values: [headers, ...rows],
			},
		});

		// Google Sheets 테이블(표) 생성 또는 업데이트
		const tableRequest = table
			? {
					updateTable: {
						table: {
							tableId: table.tableId,
							name: this.sheetName,
							range: {
								sheetId: realSheetId,
								startRowIndex: 0,
								endRowIndex: rows.length + 1,
								startColumnIndex: 0,
								endColumnIndex: headers.length,
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
								sheetId: realSheetId,
								startRowIndex: 0,
								endRowIndex: rows.length + 1,
								startColumnIndex: 0,
								endColumnIndex: headers.length,
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
			spreadsheetId: env.GOOGLE_SHEET_ID,
			requestBody: { requests: [tableRequest] },
		});
	}
}

/**
 * Form 타입에 특화된 GoogleSheetBuilder 인스턴스
 */
export const gapi = new GoogleSheetBuilder();
