import { boolean, defineEnv, email, oneOf, string, url } from "void/env";

/**
 * 환경 변수 스키마 (값은 로컬 .env / 운영은 `void secret put`).
 * 비밀값에는 default를 두지 않는다.
 */
export default defineEnv({
	/** 사이트 공개 주소 (Better Auth baseURL, SMS 링크) */
	SITE_URL: url(),

	/** Better Auth 세션 서명 키 (32자 이상 랜덤) */
	BETTER_AUTH_SECRET: string(),
	/** 관리자 가입/접근 허용 이메일 (쉼표 구분) */
	ADMIN_EMAILS: string(),

	/** 개인정보 암호화/해시용 마스터 키 (base64, 32바이트) — HKDF로 용도별 키 파생 */
	DATA_KEY: string(),

	/** Google 서비스 계정 */
	GOOGLE_SERVICE_ACCOUNT_EMAIL: email(),
	GOOGLE_PRIVATE_KEY: string(),
	/** 응답을 저장할 스프레드시트 (폼마다 탭 1개) */
	GOOGLE_SPREADSHEET_ID: string(),
	/** Apps Script onEdit 웹훅 서명 키 */
	SHEETS_WEBHOOK_SECRET: string(),

	/** SMS: live면 실제 발송, log면 로그만 남김 (개발 안전장치) */
	SMS_MODE: oneOf(["live", "log"]).default("log"),
	SOLAPI_API_KEY: string().optional(),
	SOLAPI_API_SECRET: string().optional(),
	SOLAPI_SENDER: string().optional(),

	/** 관리자 가입 허용 여부 (첫 계정 생성 후 false 권장) */
	ADMIN_SIGNUP_ENABLED: boolean().default(true),
});
