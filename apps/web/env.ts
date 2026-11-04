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

	/**
	 * 응답 저장소 어댑터. sheets(기본) = Google Sheets 주 DB, memory = 로컬 개발/검증 전용
	 * (워커 isolate 메모리라 재시작하면 사라진다. 운영에서 쓰지 않는다)
	 */
	SUBMISSION_STORE: oneOf(["sheets", "memory"]).default("sheets"),

	/** SMS: live면 실제 발송, log면 로그만 남김 (개발 안전장치) */
	SMS_MODE: oneOf(["live", "log"]).default("log"),
	SOLAPI_API_KEY: string().optional(),
	SOLAPI_API_SECRET: string().optional(),
	SOLAPI_SENDER: string().optional(),

	/** PostHog 프로젝트 키(phc_…, 공개 키). 없으면 분석/오류 추적/리플레이를 보내지 않는다 */
	POSTHOG_KEY: string().optional(),
	/** PostHog 수집 주소 (예: https://us.i.posthog.com, EU는 https://eu.i.posthog.com) */
	POSTHOG_HOST: url().default("https://us.i.posthog.com"),

	/** Cloudflare Turnstile(봇 방지). 둘 다 있으면 공개 제출에 Turnstile 통과가 필요하다 */
	TURNSTILE_SITE_KEY: string().optional(),
	TURNSTILE_SECRET_KEY: string().optional(),

	/** 첫 관리자 부트스트랩 허용 여부: 관리자 계정이 하나도 없을 때만 초대 코드 없이 가입할 수 있다 */
	ADMIN_SIGNUP_ENABLED: boolean().default(true),
});
