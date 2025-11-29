/**
 * @fileoverview Google Sheets API 클라이언트
 *
 * Google Sheets API와 통신하는 클라이언트를 제공합니다.
 * 인터페이스 기반으로 구현되어 테스트와 확장이 용이합니다.
 */

import { JWT } from "google-auth-library";
import { google, type sheets_v4 } from "googleapis";
import type {
	IGoogleSheetsClient,
	IGoogleSheetsConfig,
} from "../core/interfaces";
import { env } from "../env";

// ============================================================================
// 타입 정의
// ============================================================================

/**
 * Google Sheets 테이블 정보
 */
export interface GoogleSheetsTable {
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
 * 시트 메타데이터
 */
export interface SheetMetadata {
	sheetId: number | null;
	exists: boolean;
	table?: GoogleSheetsTable | null;
}

// ============================================================================
// Google Sheets 클라이언트 구현
// ============================================================================

/**
 * Google Sheets API 클라이언트
 * IGoogleSheetsClient 인터페이스를 구현합니다.
 */
export class GoogleSheetsClient implements IGoogleSheetsClient {
	private readonly auth: JWT;
	private readonly sheets: sheets_v4.Sheets;
	private readonly config: IGoogleSheetsConfig;

	constructor(config?: Partial<IGoogleSheetsConfig>) {
		this.config = {
			spreadsheetId: config?.spreadsheetId || env.GOOGLE_SHEET_ID,
			sheetName: config?.sheetName || env.GOOGLE_SHEET_TITLE,
			credentials: config?.credentials || {
				clientEmail: env.GOOGLE_CLIENT_EMAIL,
				privateKey: env.GOOGLE_PRIVATE_KEY,
			},
		};

		this.auth = new JWT({
			email: this.config.credentials?.clientEmail,
			key: this.config.credentials?.privateKey,
			scopes: [
				"https://www.googleapis.com/auth/spreadsheets",
				"https://www.googleapis.com/auth/drive",
			],
		});

		this.sheets = google.sheets({ version: "v4", auth: this.auth });
	}

	/**
	 * 현재 설정 반환
	 */
	getConfig(): IGoogleSheetsConfig {
		return this.config;
	}

	/**
	 * 스프레드시트 접근 권한 확인
	 */
	async checkAccess(spreadsheetId?: string): Promise<boolean> {
		try {
			await this.sheets.spreadsheets.get({
				spreadsheetId: spreadsheetId || this.config.spreadsheetId,
				fields: "spreadsheetId",
			});
			return true;
		} catch (error) {
			console.error("스프레드시트 접근 권한 확인 실패:", error);
			return false;
		}
	}

	/**
	 * 시트 메타데이터 조회
	 */
	async getSheetMetadata(
		spreadsheetId?: string,
		sheetName?: string
	): Promise<SheetMetadata> {
		const targetSpreadsheetId = spreadsheetId || this.config.spreadsheetId;
		const targetSheetName = sheetName || this.config.sheetName;

		try {
			const res = await this.sheets.spreadsheets.get({
				spreadsheetId: targetSpreadsheetId,
				fields: "sheets.properties,sheets.tables",
			});

			const sheet = res.data.sheets?.find(
				(s) => s.properties?.title === targetSheetName
			);

			if (!sheet) {
				return { sheetId: null, exists: false };
			}

			return {
				sheetId: sheet.properties?.sheetId ?? null,
				exists: true,
				table: sheet.tables?.[0] ?? null,
			};
		} catch (error) {
			console.error("시트 메타데이터 조회 실패:", error);
			return { sheetId: null, exists: false };
		}
	}

	/**
	 * 새 시트 생성
	 */
	async createSheet(
		spreadsheetId?: string,
		sheetName?: string
	): Promise<number> {
		const targetSpreadsheetId = spreadsheetId || this.config.spreadsheetId;
		const targetSheetName = sheetName || this.config.sheetName;

		const res = await this.sheets.spreadsheets.batchUpdate({
			spreadsheetId: targetSpreadsheetId,
			requestBody: {
				requests: [
					{
						addSheet: {
							properties: {
								title: targetSheetName,
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

		const newSheetId = res.data.replies?.[0]?.addSheet?.properties?.sheetId;
		if (newSheetId === undefined || newSheetId === null) {
			throw new Error("시트 생성에 실패했습니다.");
		}

		return newSheetId;
	}

	/**
	 * 데이터 쓰기
	 */
	async writeData(
		spreadsheetId: string,
		range: string,
		values: unknown[][]
	): Promise<void> {
		await this.sheets.spreadsheets.values.update({
			spreadsheetId,
			range,
			valueInputOption: "USER_ENTERED",
			requestBody: { values },
		});
	}

	/**
	 * 데이터 클리어
	 */
	async clearData(spreadsheetId: string, range: string): Promise<void> {
		await this.sheets.spreadsheets.values.clear({
			spreadsheetId,
			range,
		});
	}

	/**
	 * 배치 업데이트 (테이블 생성/수정 등)
	 */
	async batchUpdate(
		spreadsheetId: string,
		requests: sheets_v4.Schema$Request[]
	): Promise<void> {
		await this.sheets.spreadsheets.batchUpdate({
			spreadsheetId,
			requestBody: { requests },
		});
	}

	/**
	 * 시트가 존재하는지 확인하고 없으면 생성
	 */
	async ensureSheet(
		spreadsheetId?: string,
		sheetName?: string
	): Promise<number> {
		const metadata = await this.getSheetMetadata(spreadsheetId, sheetName);

		if (metadata.exists && metadata.sheetId !== null) {
			return metadata.sheetId;
		}

		return this.createSheet(spreadsheetId, sheetName);
	}
}

// ============================================================================
// 팩토리 함수 및 싱글턴
// ============================================================================

/**
 * Google Sheets 클라이언트 생성
 */
export function createGoogleSheetsClient(
	config?: Partial<IGoogleSheetsConfig>
): GoogleSheetsClient {
	return new GoogleSheetsClient(config);
}

/**
 * 기본 싱글턴 인스턴스 (환경변수 기반)
 */
let defaultClient: GoogleSheetsClient | null = null;

export function getDefaultGoogleSheetsClient(): GoogleSheetsClient {
	if (!defaultClient) {
		defaultClient = new GoogleSheetsClient();
	}
	return defaultClient;
}

// 하위 호환성을 위한 별칭
export { GoogleSheetsClient as GoogleApiClient };
export const googleApiClient = {
	get sheets() {
		return getDefaultGoogleSheetsClient();
	},
};
