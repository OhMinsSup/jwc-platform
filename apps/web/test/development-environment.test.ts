import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
const OFFLINE_OPTIONS = [
	"--no-armor",
	"--no-native",
	"--no-1password",
	"--no-bitwarden",
];

function runDotenvx(args: string[]) {
	return spawnSync("pnpm", ["exec", "dotenvx", ...args], {
		cwd: APP_DIRECTORY,
		encoding: "utf-8",
		env: { PATH, DOTENVX_NO_ARMOR: "true" },
	});
}

describe("development environment", () => {
	it("replaces inherited live settings with offline values without using a key", () => {
		const result = spawnSync(
			"pnpm",
			[
				"with-env",
				...NODE_PROBE,
				`console.log(JSON.stringify({
					memory: process.env.SUBMISSION_STORE === "memory",
					noSms: process.env.SMS_MODE === "log" && !process.env.SOLAPI_API_SECRET,
					noGoogle: process.env.GOOGLE_PRIVATE_KEY === "unused-in-memory-store",
					noAnalytics: !process.env.POSTHOG_KEY,
					noTurnstile: !process.env.TURNSTILE_SECRET_KEY,
					noDeploy: !process.env.CLOUDFLARE_API_TOKEN && !process.env.VOID_TOKEN
				}));`,
			],
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

	it("decrypts a fixture at process startup and stops when its key is missing", () => {
		const directory = mkdtempSync(path.join(tmpdir(), "jwc-dotenvx-"));
		const file = path.join(directory, ".env");
		const keys = path.join(directory, ".env.keys");
		const fixtureValue = "test-only-encrypted-fixture";
		try {
			writeFileSync(file, `JWC_TEST_SECRET=${fixtureValue}\n`);
			const encrypted = runDotenvx([
				"encrypt",
				...OFFLINE_OPTIONS,
				"-f",
				file,
				"-fk",
				keys,
			]);
			expect(encrypted.status).toBe(0);
			expect(readFileSync(file, "utf-8")).not.toContain(fixtureValue);
			const args = [
				"run",
				"--strict",
				...OFFLINE_OPTIONS,
				"-f",
				file,
				"-fk",
				keys,
				"--",
				...NODE_PROBE,
				`console.log(process.env.JWC_TEST_SECRET === "${fixtureValue}" ? "fixture-ok" : "fixture-invalid");`,
			];
			const decrypted = runDotenvx(args);
			expect(decrypted.status).toBe(0);
			expect(decrypted.stdout).toContain("fixture-ok");
			rmSync(keys);
			const missingKey = runDotenvx(args);
			expect({
				stopped: missingKey.status !== 0,
				executed: missingKey.stdout.includes("fixture-ok"),
				leaked: (missingKey.stdout + missingKey.stderr).includes(fixtureValue),
			}).toStrictEqual({ stopped: true, executed: false, leaked: false });
		} finally {
			rmSync(directory, { recursive: true, force: true });
		}
	});
});
