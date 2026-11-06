import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vite-plus/test";
import { z } from "zod";

const APP_DIRECTORY = fileURLToPath(new URL("../", import.meta.url));
const { PATH } = z
	.object({ env: z.object({ PATH: z.string() }) })
	.parse(process).env;
const NODE_PROBE = ["node", "--input-type=module", "--eval"];
const OFFLINE_PROBE = `console.log(JSON.stringify({
	memory: process.env.SUBMISSION_STORE === "memory",
	noSms: process.env.SMS_MODE === "log" && !process.env.SOLAPI_API_SECRET,
	noGoogle: process.env.GOOGLE_PRIVATE_KEY === "unused-in-memory-store",
	noAnalytics: !process.env.POSTHOG_KEY,
	noTurnstile: !process.env.TURNSTILE_SECRET_KEY,
	noDeploy: !process.env.CLOUDFLARE_API_TOKEN && !process.env.VOID_TOKEN
}));`;

describe("development environment", () => {
	it("replaces inherited live settings with offline values", () => {
		const result = spawnSync(
			"pnpm",
			["with-env", ...NODE_PROBE, OFFLINE_PROBE],
			{
				cwd: APP_DIRECTORY,
				encoding: "utf-8",
				env: {
					PATH,
					SUBMISSION_STORE: "sheets",
					SMS_MODE: "live",
					SOLAPI_API_SECRET: "test-inherited-sms",
					GOOGLE_PRIVATE_KEY: "test-inherited-google",
					POSTHOG_KEY: "test-inherited-analytics",
					TURNSTILE_SECRET_KEY: "test-inherited-turnstile",
					CLOUDFLARE_API_TOKEN: "test-inherited-cloudflare",
					VOID_TOKEN: "test-inherited-void",
				},
			},
		);
		expect(result.status).toBe(0);
		expect(result.stdout).toContain(
			JSON.stringify({
				memory: true,
				noSms: true,
				noGoogle: true,
				noAnalytics: true,
				noTurnstile: true,
				noDeploy: true,
			}),
		);
	});

	it("loads plaintext values without expanding dollar signs or printing them", () => {
		const directory = mkdtempSync(path.join(tmpdir(), "jwc-dotenv-"));
		const file = path.join(directory, ".env");
		const fixtureValue = "test-only-$JWC_EXPANDED-fixture";
		try {
			writeFileSync(
				file,
				`JWC_EXPANDED=expanded\nJWC_TEST_SECRET='${fixtureValue}'\nJWC_MULTILINE="first\\nsecond"\n`,
			);
			const result = spawnSync(
				"pnpm",
				[
					"exec",
					"dotenv",
					"--no-expand",
					"-o",
					"-e",
					file,
					"--",
					...NODE_PROBE,
					`console.log(JSON.stringify({
						literal: process.env.JWC_TEST_SECRET === ${JSON.stringify(fixtureValue)},
						multiline: process.env.JWC_MULTILINE === "first\\nsecond"
					}));`,
				],
				{ cwd: APP_DIRECTORY, encoding: "utf-8", env: { PATH } },
			);
			expect(result.status).toBe(0);
			expect(result.stdout).toContain(
				JSON.stringify({ literal: true, multiline: true }),
			);
			expect(result.stdout + result.stderr).not.toContain(fixtureValue);
		} finally {
			rmSync(directory, { recursive: true, force: true });
		}
	});
});
