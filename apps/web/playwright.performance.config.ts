import process from "node:process";

import { defineConfig, devices } from "@playwright/test";
import { z } from "zod";

import {
	PERFORMANCE_ACCOUNTS,
	PERFORMANCE_ORIGIN,
	PERFORMANCE_SECRET,
} from "./e2e/performance/settings";

const settings = z
	.object({
		env: z.object({
			PERFORMANCE_SAMPLES: z.coerce.number().int().min(1).max(10).default(5),
		}),
	})
	.parse(process);

export default defineConfig({
	testDir: "./e2e/performance",
	globalSetup: "./e2e/performance/seed.ts",
	workers: 1,
	retries: 0,
	timeout: 1_200_000,
	reporter: "list",
	metadata: { samples: settings.env.PERFORMANCE_SAMPLES },
	use: {
		...devices["Pixel 7"],
		actionTimeout: 15_000,
		navigationTimeout: 30_000,
		baseURL: PERFORMANCE_ORIGIN,
		locale: "ko-KR",
		timezoneId: "Asia/Seoul",
		trace: "off",
	},
	projects: [{ name: "mobile-production", use: { browserName: "chromium" } }],
	webServer: {
		command:
			"pnpm exec vp build --mode performance && node e2e/performance/configure-preview.mjs && node e2e/performance/serve.mjs",
		url: `${PERFORMANCE_ORIGIN}/admin/login`,
		reuseExistingServer: false,
		timeout: 120_000,
		env: {
			SITE_URL: PERFORMANCE_ORIGIN,
			SUBMISSION_STORE: "memory",
			SMS_MODE: "log",
			ADMIN_EMAILS: Object.values(PERFORMANCE_ACCOUNTS)
				.map((account) => account.email)
				.join(","),
			ADMIN_PHONES: Object.values(PERFORMANCE_ACCOUNTS)
				.map((account) => `${account.email}=${account.phone}`)
				.join(","),
			BETTER_AUTH_SECRET: PERFORMANCE_SECRET,
		},
	},
});
