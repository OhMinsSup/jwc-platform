import { deriveDataKeys } from "@jwc/common/crypto";
import type { DataKeys } from "@jwc/common/crypto";
import { createTokenProvider } from "@jwc/google/service-account";
import { createSheetsClient } from "@jwc/google/sheets-client";
import type { PostHogConfig } from "@jwc/observability/posthog";
import type { SubmissionStore } from "@jwc/submission-store";
import { createGoogleSheetsStore } from "@jwc/submission-store/google-sheets";
import { createMemorySubmissionStore } from "@jwc/submission-store/memory";
import { env } from "void/env";

import { DomainError } from "./errors/domain-error";
import { createSolapiSender, loggingSender } from "./solapi";
import type { SmsSender } from "./solapi";

/**
 * 환경 변수 → 외부 클라이언트 조립. env를 읽는 유일한 경계.
 * isolate 수명 동안 재사용되도록 지연 생성 후 캐시한다.
 */

const TRAILING_SLASH = /\/$/u;

let keys: Promise<DataKeys> | null = null;
let store: SubmissionStore | null = null;
let sender: SmsSender | null = null;

export function authRuntimeConfig() {
	return {
		siteUrl: env.SITE_URL,
		secret: env.BETTER_AUTH_SECRET,
		adminPhones: env.ADMIN_PHONES ?? "",
		adminEmails: env.ADMIN_EMAILS ?? "",
	};
}

export function authSmsSender(): SmsSender {
	if (smsMode() !== "live") {
		throw new DomainError(
			"휴대전화 인증을 사용하려면 실제 SMS 발송 설정이 필요합니다",
			{ code: "upstream_rejected" },
		);
	}
	return smsSender();
}

export function dataKeys(): Promise<DataKeys> {
	keys ??= deriveDataKeys(env.DATA_KEY);
	return keys;
}

/**
 * 응답 저장소. 저장소를 바꾸려면 여기서 다른 어댑터를 조립한다 (서비스는 포트에만 의존).
 */
export function submissionStore(): SubmissionStore {
	store ??=
		env.SUBMISSION_STORE === "memory"
			? createMemorySubmissionStore()
			: createGoogleSheetsStore(
					createSheetsClient(
						env.GOOGLE_SPREADSHEET_ID,
						createTokenProvider({
							email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
							privateKeyPem: env.GOOGLE_PRIVATE_KEY,
						}),
					),
				);
	return store;
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

export function spreadsheetUrl(): string {
	return `https://docs.google.com/spreadsheets/d/${env.GOOGLE_SPREADSHEET_ID}/edit`;
}

export function adminSignupEnabled(): boolean {
	// 기본값 해석에 의존하지 않는다: 명시적으로 false일 때만 가입을 막는다
	// oxlint-disable-next-line typescript/no-unnecessary-boolean-literal-compare -- 위 이유로 의도된 비교
	return env.ADMIN_SIGNUP_ENABLED !== false;
}

/** PostHog 설정. 키가 없으면 null (관측 데이터를 외부로 보내지 않는다) */
export function posthogConfig(): PostHogConfig | null {
	return env.POSTHOG_KEY
		? {
				apiKey: env.POSTHOG_KEY,
				host: env.POSTHOG_HOST.replace(TRAILING_SLASH, ""),
			}
		: null;
}

/** 사이트 출처 (예: https://forms.example.org) — 교차 출처 요청 판정 */
export function siteOrigin(): string {
	return new URL(env.SITE_URL).origin;
}

export interface TurnstileConfig {
	secretKey: string;
	siteKey: string;
}

/** Turnstile 설정. 두 키가 모두 있을 때만 켠다 */
export function turnstileConfig(): TurnstileConfig | null {
	const { TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY } = env;
	return TURNSTILE_SITE_KEY && TURNSTILE_SECRET_KEY
		? { siteKey: TURNSTILE_SITE_KEY, secretKey: TURNSTILE_SECRET_KEY }
		: null;
}
