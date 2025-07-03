import { JWT } from "google-auth-library";
import { google } from "googleapis";
import type { GoogleSheetsConfig } from "../core/types";
import { env } from "../env";

/**
 * Google API 클라이언트 클래스
 * Google Sheets 및 Drive API에 인증된 클라이언트 인스턴스를 제공합니다.
 */
export class GoogleApiClient {
	/** Google 인증(JWT) 인스턴스 */
	public readonly auth: JWT;

	/** Google Sheets API 클라이언트 인스턴스 */
	public readonly sheets: ReturnType<typeof google.sheets>;

	/** Google Drive API 클라이언트 인스턴스 */
	public readonly drive: ReturnType<typeof google.drive>;

	/**
	 * Google API 클라이언트를 생성합니다.
	 * @param config - Google Sheets 설정 (선택사항, 기본값은 환경 변수 사용)
	 */
	constructor(config?: GoogleSheetsConfig) {
		const clientConfig = config || {
			clientEmail: env.GOOGLE_CLIENT_EMAIL,
			privateKey: env.GOOGLE_PRIVATE_KEY,
			spreadsheetId: env.GOOGLE_SHEET_ID,
			sheetName: env.GOOGLE_SHEET_TITLE,
		};

		this.auth = new JWT({
			email: clientConfig.clientEmail,
			key: clientConfig.privateKey,
			scopes: [
				"https://www.googleapis.com/auth/spreadsheets",
				"https://www.googleapis.com/auth/drive",
			],
		});

		this.sheets = google.sheets({ version: "v4", auth: this.auth });
		this.drive = google.drive({ version: "v3", auth: this.auth });
	}

	/**
	 * 인증을 수행합니다.
	 * @returns 인증 결과
	 */
	async authorize(): Promise<void> {
		await this.auth.authorize();
	}

	/**
	 * 스프레드시트 접근 권한을 확인합니다.
	 * @param spreadsheetId - 확인할 스프레드시트 ID
	 * @returns 접근 가능 여부
	 */
	async checkSpreadsheetAccess(spreadsheetId: string): Promise<boolean> {
		try {
			await this.sheets.spreadsheets.get({
				spreadsheetId,
				fields: "spreadsheetId",
			});
			return true;
		} catch (error) {
			console.error("스프레드시트 접근 권한 확인 실패:", error);
			return false;
		}
	}
}

/**
 * 싱글턴 Google API 클라이언트 인스턴스
 */
export const googleApiClient = new GoogleApiClient();
