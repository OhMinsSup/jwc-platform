/**
 * @fileoverview Google Sheets 동기화 관리자
 *
 * 스키마 기반으로 Google Sheets에 데이터를 동기화합니다.
 */

import type { sheets_v4 } from "googleapis";
import type {
	IGoogleSheetsConfig,
	IGoogleSheetsSyncer,
	ISpreadsheetSchema,
} from "../core/interfaces";
import { SchemaBasedTransformer } from "../core/transformer";
import { GoogleSheetsClient, type GoogleSheetsTable } from "./client";

// ============================================================================
// Google Sheets 동기화 결과 타입
// ============================================================================

export interface GoogleSheetsSyncResult {
	success: boolean;
	rowCount: number;
	sheetId?: number;
	error?: string;
}

// ============================================================================
// 스키마 기반 Google Sheets 동기화 관리자
// ============================================================================

/**
 * 스키마 기반 Google Sheets 동기화 관리자
 */
export class GoogleSheetsSyncer<T = Record<string, unknown>>
	implements IGoogleSheetsSyncer<T>
{
	private readonly client: GoogleSheetsClient;
	private schema: ISpreadsheetSchema<T> | null = null;
	private transformer: SchemaBasedTransformer<T> | null = null;
	private data: T[] = [];
	private spreadsheetId: string;
	private sheetName: string;

	constructor(config?: Partial<IGoogleSheetsConfig>) {
		this.client = new GoogleSheetsClient(config);
		const clientConfig = this.client.getConfig();
		this.spreadsheetId = clientConfig.spreadsheetId;
		this.sheetName = clientConfig.sheetName;
	}

	/**
	 * 스키마 설정
	 */
	withSchema(schema: ISpreadsheetSchema<T>): this {
		this.schema = schema;
		this.transformer = new SchemaBasedTransformer(schema);
		// 스키마에 기본 시트명이 있으면 사용
		if (schema.defaultSheetName) {
			this.sheetName = schema.defaultSheetName;
		}
		return this;
	}

	/**
	 * 데이터 설정
	 */
	withData(data: T[]): this {
		this.data = data;
		return this;
	}

	/**
	 * 스프레드시트 ID 설정
	 */
	withSpreadsheetId(id: string): this {
		this.spreadsheetId = id;
		return this;
	}

	/**
	 * 시트명 설정
	 */
	withSheetName(name: string): this {
		this.sheetName = name;
		return this;
	}

	/**
	 * Google Sheets에 동기화
	 */
	async sync(): Promise<GoogleSheetsSyncResult> {
		if (!this.schema) {
			throw new Error(
				"스키마가 설정되지 않았습니다. withSchema()를 먼저 호출하세요."
			);
		}

		if (!this.transformer) {
			throw new Error(
				"스키마가 설정되지 않았습니다. withSchema()를 먼저 호출하세요."
			);
		}

		if (this.data.length === 0) {
			throw new Error(
				"동기화할 데이터가 없습니다. withData()를 먼저 호출하세요."
			);
		}

		try {
			// 헤더와 데이터 준비
			const headers = this.transformer.getHeaders();
			const rows = this.transformer.toRows(this.data);

			// 시트 확인/생성
			const sheetId = await this.client.ensureSheet(
				this.spreadsheetId,
				this.sheetName
			);

			// 기존 데이터 클리어
			await this.client.clearData(this.spreadsheetId, this.sheetName);

			// 새 데이터 쓰기
			await this.client.writeData(this.spreadsheetId, `${this.sheetName}!A1`, [
				headers,
				...rows,
			]);

			// 테이블 업데이트 (옵션)
			await this.updateTable(sheetId, headers, rows.length);

			return {
				success: true,
				rowCount: rows.length,
				sheetId,
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error("Google Sheets 동기화 오류:", error);
			return {
				success: false,
				rowCount: 0,
				error: errorMessage,
			};
		}
	}

	/**
	 * Google Sheets 테이블 업데이트
	 */
	private async updateTable(
		sheetId: number,
		headers: string[],
		rowCount: number
	): Promise<void> {
		if (!this.schema) {
			return;
		}

		const metadata = await this.client.getSheetMetadata(
			this.spreadsheetId,
			this.sheetName
		);

		const columnProperties = this.schema.columns.map((col, idx) => {
			const columnDef: sheets_v4.Schema$TableColumnProperties = {
				columnName: col.header,
				columnIndex: idx,
			};

			// 드롭다운 타입인 경우 데이터 검증 규칙 추가
			if (col.type === "dropdown" && col.options) {
				columnDef.dataValidationRule = {
					condition: {
						type: "ONE_OF_LIST",
						values: col.options.map((option) => ({
							userEnteredValue: option,
						})),
					},
				};
			}

			return columnDef;
		});

		const tableRequest = this.buildTableRequest({
			sheetId,
			columnCount: headers.length,
			rowCount,
			columnProperties,
			existingTable: metadata.table,
		});

		await this.client.batchUpdate(this.spreadsheetId, [tableRequest]);
	}

	/**
	 * 테이블 요청 빌드
	 */
	private buildTableRequest(options: {
		sheetId: number;
		columnCount: number;
		rowCount: number;
		columnProperties: sheets_v4.Schema$TableColumnProperties[];
		existingTable?: GoogleSheetsTable | null;
	}): sheets_v4.Schema$Request {
		const { sheetId, columnCount, rowCount, columnProperties, existingTable } =
			options;
		const tableRange = {
			sheetId,
			startRowIndex: 0,
			endRowIndex: rowCount + 1,
			startColumnIndex: 0,
			endColumnIndex: columnCount,
		};

		if (existingTable?.tableId) {
			return {
				updateTable: {
					table: {
						tableId: existingTable.tableId,
						name: this.sheetName,
						range: tableRange,
						columnProperties,
					},
					fields: "*",
				},
			};
		}

		return {
			addTable: {
				table: {
					name: this.sheetName,
					range: tableRange,
					columnProperties,
				},
			},
		};
	}
}

// ============================================================================
// 팩토리 함수
// ============================================================================

/**
 * Google Sheets 동기화 관리자 생성
 */
export function createGoogleSheetsSyncer<T = Record<string, unknown>>(
	config?: Partial<IGoogleSheetsConfig>
): GoogleSheetsSyncer<T> {
	return new GoogleSheetsSyncer<T>(config);
}

/**
 * 스키마와 데이터로 Google Sheets에 빠르게 동기화
 */
export async function syncToGoogleSheets<T = Record<string, unknown>>(
	schema: ISpreadsheetSchema<T>,
	data: T[],
	config?: Partial<IGoogleSheetsConfig>
): Promise<GoogleSheetsSyncResult> {
	const syncer = new GoogleSheetsSyncer<T>(config);
	const result = await syncer.withSchema(schema).withData(data).sync();
	return result;
}

// 하위 호환성을 위한 별칭
export { GoogleSheetsSyncer as GoogleSheetsSyncManager };
