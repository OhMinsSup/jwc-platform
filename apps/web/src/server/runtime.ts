import { env } from "void/env";

import { deriveDataKeys } from "./crypto";
import type { DataKeys } from "./crypto";
import { createTokenProvider } from "./google/service-account";
import { createSheetsClient } from "./google/sheets-client";
import type { SheetsClient } from "./google/sheets-client";
import { createSolapiSender, loggingSender } from "./solapi";
import type { SmsSender } from "./solapi";

/**
 * 환경 변수 → 외부 클라이언트 조립. env를 읽는 유일한 경계.
 * isolate 수명 동안 재사용되도록 지연 생성 후 캐시한다.
 */

const TRAILING_SLASH = /\/$/u;

let keys: Promise<DataKeys> | null = null;
let sheetsClient: SheetsClient | null = null;
let sender: SmsSender | null = null;

export function dataKeys(): Promise<DataKeys> {
	keys ??= deriveDataKeys(env.DATA_KEY);
	return keys;
}

export function sheets(): SheetsClient {
	sheetsClient ??= createSheetsClient(
		env.GOOGLE_SPREADSHEET_ID,
		createTokenProvider({
			email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
			privateKeyPem: env.GOOGLE_PRIVATE_KEY,
		}),
	);
	return sheetsClient;
}

export function smsSender(): SmsSender {
	if (sender) {
		return sender;
	}
	if (smsMode() !== "live") {
		sender = loggingSender;
		return sender;
	}
	const { SOLAPI_API_KEY, SOLAPI_API_SECRET, SOLAPI_SENDER } = env;
	if (!(SOLAPI_API_KEY && SOLAPI_API_SECRET && SOLAPI_SENDER)) {
		throw new Error(
			"SMS_MODE=live 에는 SOLAPI_API_KEY / SOLAPI_API_SECRET / SOLAPI_SENDER 가 필요합니다",
		);
	}
	sender = createSolapiSender({
		apiKey: SOLAPI_API_KEY,
		apiSecret: SOLAPI_API_SECRET,
		sender: SOLAPI_SENDER,
	});
	return sender;
}

/** 명시적으로 live일 때만 실제 발송 (실수로 문자가 나가지 않도록) */
export function smsMode(): "live" | "log" {
	return env.SMS_MODE === "live" ? "live" : "log";
}

function siteUrl(): string {
	return env.SITE_URL.replace(TRAILING_SLASH, "");
}

export function submissionLink(submissionId: string): string {
	return `${siteUrl()}/r/${submissionId}`;
}

export function spreadsheetId(): string {
	return env.GOOGLE_SPREADSHEET_ID;
}

export function spreadsheetUrl(): string {
	return `https://docs.google.com/spreadsheets/d/${env.GOOGLE_SPREADSHEET_ID}/edit`;
}

export function adminEmails(): ReadonlySet<string> {
	return new Set(
		env.ADMIN_EMAILS.split(",")
			.map((email) => email.trim().toLowerCase())
			.filter(Boolean),
	);
}

export function adminSignupEnabled(): boolean {
	// 기본값 해석에 의존하지 않는다: 명시적으로 false일 때만 가입을 막는다
	// oxlint-disable-next-line typescript/no-unnecessary-boolean-literal-compare -- 위 이유로 의도된 비교
	return env.ADMIN_SIGNUP_ENABLED !== false;
}

export function sheetsWebhookSecret(): string {
	return env.SHEETS_WEBHOOK_SECRET;
}
