import process from "node:process";

import { defineConfig, devices } from "@playwright/test";
import { z } from "zod";

/**
 * 공개 신청 화면 E2E. 개발 서버를 별도 포트로 띄워 사용 중인 로컬 서버(5173)와 겹치지 않게 하고,
 * 응답은 메모리 저장소(SUBMISSION_STORE=memory)에 둬 Google Sheets에 쓰지 않는다.
 * 로컬 D1에는 E2E 전용 폼 하나만 다시 넣는다 (e2e/seed.ts).
 */
const PORT = 5179;
const BASE_URL = `http://localhost:${PORT}`;
const SERVER_START_TIMEOUT_MS = 120_000;
/** Workers 선언의 process:any와 분리해 Node 설정을 경계에서 검증한다. */
const IS_CI = Boolean(
	z.object({ env: z.object({ CI: z.string().optional() }) }).parse(process).env
		.CI,
);

export default defineConfig({
	testDir: "./e2e",
	globalSetup: "./e2e/seed.ts",
	fullyParallel: false,
	forbidOnly: IS_CI,
	retries: IS_CI ? 1 : 0,
	reporter: IS_CI ? [["github"], ["list"]] : "list",
	use: {
		baseURL: BASE_URL,
		locale: "ko-KR",
		timezoneId: "Asia/Seoul",
		trace: "retain-on-failure",
	},
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
	webServer: {
		command: `pnpm exec vp dev --mode e2e --port ${PORT} --strictPort`,
		url: BASE_URL,
		reuseExistingServer: false,
		timeout: SERVER_START_TIMEOUT_MS,
		// 제출 출처 검사(SITE_URL)가 이 포트와 맞아야 한다. 비밀값이 필요 없는 값만 덮는다
		env: {
			SITE_URL: BASE_URL,
			SUBMISSION_STORE: "memory",
			SMS_MODE: "log",
			ADMIN_EMAILS: "e2e@example.com",
			ADMIN_PHONES: "e2e@example.com=01012345678",
			BETTER_AUTH_SECRET: "e2e-only-not-a-secret-0123456789abcdef",
		},
	},
});
