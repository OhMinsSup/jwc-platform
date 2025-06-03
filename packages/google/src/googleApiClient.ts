import { JWT } from "google-auth-library";
import { google } from "googleapis";
import { env } from "./env";

/**
 * Google API 클라이언트 클래스
 *
 * Google Sheets 및 Drive API에 인증된 클라이언트 인스턴스를 제공합니다.
 */
class GoogleApiClient {
	/** Google 인증(JWT) 인스턴스 */
	public readonly auth: JWT;

	/** Google Sheets API 클라이언트 인스턴스 */
	public readonly sheets: ReturnType<typeof google.sheets>;

	/**
	 * Google API 클라이언트를 생성합니다.
	 *
	 * @remarks
	 * 환경 변수에서 인증 정보를 읽어 JWT 인증 및 Sheets API 클라이언트를 초기화합니다.
	 */
	constructor() {
		this.auth = new JWT({
			email: env.GOOGLE_CLIENT_EMAIL,
			key: env.GOOGLE_PRIVATE_KEY,
			scopes: [
				"https://www.googleapis.com/auth/spreadsheets",
				"https://www.googleapis.com/auth/drive",
			],
		});
		this.sheets = google.sheets({ version: "v4", auth: this.auth });
	}
}

/**
 * 싱글턴 Google API 클라이언트 인스턴스
 */
export const googleApiClient = new GoogleApiClient();
