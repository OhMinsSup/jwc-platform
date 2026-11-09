import { spawnSync } from "node:child_process";
import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vite-plus/test";
import { z } from "zod";

const APP_DIRECTORY = fileURLToPath(new URL("../", import.meta.url));
const { PATH, npm_execpath: PNPM_ENTRY } = z
	.object({ env: z.object({ PATH: z.string(), npm_execpath: z.string() }) })
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

describe("environment selection", () => {
	it("exposes one dev command without real variants", () => {
		for (const file of [
			new URL("../../../package.json", import.meta.url),
			new URL("../package.json", import.meta.url),
		]) {
			const { scripts } = z
				.object({ scripts: z.record(z.string(), z.string()) })
				.parse(JSON.parse(readFileSync(file, "utf-8")));
			expect(scripts).toHaveProperty("dev");
			expect(scripts).not.toHaveProperty("dev:real");
			expect(scripts).not.toHaveProperty("with-env:real");
		}
	});

	it.each([
		{ script: "with-env:test", siteUrl: "http://localhost:5179" },
		{ script: "with-env:performance", siteUrl: "http://localhost:5181" },
	])("$script selects its own offline environment", ({ script, siteUrl }) => {
		const result = spawnSync(
			"pnpm",
			[
				script,
				...NODE_PROBE,
				`${OFFLINE_PROBE}\nconsole.log(process.env.SITE_URL === ${JSON.stringify(siteUrl)});`,
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
					SITE_URL: "https://inherited.example.org",
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
		expect(result.stdout).toContain("true\n");
	});

	it("loads development settings only from the development directory", () => {
		const directory = mkdtempSync(path.join(tmpdir(), "jwc-env-layout-"));
		const app = path.join(directory, "apps/web");
		const config = path.join(directory, "config/env/development");
		const { scripts } = z
			.object({ scripts: z.object({ "with-env": z.string() }) })
			.parse(
				JSON.parse(
					readFileSync(path.join(APP_DIRECTORY, "package.json"), "utf-8"),
				),
			);
		try {
			mkdirSync(app, { recursive: true });
			mkdirSync(config, { recursive: true });
			writeFileSync(
				path.join(app, "package.json"),
				JSON.stringify({ scripts }),
			);
			symlinkSync(
				path.join(APP_DIRECTORY, "node_modules"),
				path.join(app, "node_modules"),
				"dir",
			);
			writeFileSync(path.join(directory, ".env"), "JWC_SELECTED=old-root\n");
			writeFileSync(
				path.join(config, ".env"),
				"JWC_SELECTED=development-folder\n",
				{ mode: 0o600 },
			);
			const args = [
				"with-env",
				...NODE_PROBE,
				'console.log(process.env.JWC_SELECTED === "development-folder")',
			];
			// 임시 앱에도 부모 테스트와 같은 pnpm을 써서 전역 버전의 자동 설치를 피한다.
			const loaded = spawnSync("node", [PNPM_ENTRY, ...args], {
				cwd: app,
				encoding: "utf-8",
				env: { PATH },
			});
			expect(loaded.status).toBe(0);
			expect(loaded.stdout).toContain("true\n");
			rmSync(path.join(config, ".env"));
			const missing = spawnSync(
				"node",
				[
					PNPM_ENTRY,
					"with-env",
					...NODE_PROBE,
					"console.log(process.env.JWC_SELECTED === undefined)",
				],
				{ cwd: app, encoding: "utf-8", env: { PATH } },
			);
			expect(missing.status).toBe(0);
			expect(missing.stdout).toContain("true\n");
		} finally {
			rmSync(directory, { recursive: true, force: true });
		}
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
