import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";

import { describe, expect, it } from "vite-plus/test";

import {
	guarddogExitCode,
	installedPaths,
	lockedPackages,
	optionalPackages,
	runChecks,
} from "./model.ts";
import { execute } from "./process.ts";

describe("security scan coverage", () => {
	it("does not skip a required instance of an otherwise optional package", () => {
		const source =
			"lockfileVersion: '9.0'\npackages: {}\nsnapshots:\n  'optional@1.0.0': { optional: true }\n  'mixed@1.0.0(peer@1.0.0)': { optional: true }\n  'mixed@1.0.0(peer@2.0.0)': {}\n";
		expect(optionalPackages(source)).toStrictEqual(["optional@1.0.0"]);
	});

	it("includes dev, optional, nested and multiple versions without unsaved packages", () => {
		const paths = installedPaths([
			{
				dependencies: {
					app: {
						path: "/workspace/app",
						dependencies: { dependency: { path: "/store/lib-v1" } },
					},
				},
				devDependencies: {
					tool: {
						path: "/store/tool",
						optionalDependencies: { dependency: { path: "/store/lib-v2" } },
					},
				},
				unsavedDependencies: { stale: { path: "/store/stale" } },
			},
		]);
		expect(paths).toStrictEqual([
			"/store/lib-v1",
			"/store/lib-v2",
			"/store/tool",
			"/workspace/app",
		]);
	});

	it("validates lockfiles and preserves scoped package versions", () => {
		expect([
			...lockedPackages(
				"lockfileVersion: '9.0'\npackages:\n  '@scope/pkg@1.0.0': {}\n  '@scope/pkg@2.0.0': {}\n",
			),
		]).toStrictEqual(["@scope/pkg@1.0.0", "@scope/pkg@2.0.0"]);
		expect(() => lockedPackages("packages: {}\n")).toThrow("lockfile");
		expect(() => installedPaths([])).toThrow("프로젝트");
		expect(() => installedPaths([{ dependencies: { broken: {} } }])).toThrow(
			"경로",
		);
	});
});

describe("security scan failures", () => {
	it("rejects GuardDog's zero-issue download failures and malformed reports", () => {
		expect(
			guarddogExitCode({ issues: 0, errors: { "download-package": "failed" } }),
		).toBe(2);
		expect(guarddogExitCode({ issues: 0, errors: {} })).toBe(2);
		expect(guarddogExitCode({ issues: 0, errors: {}, risks: [] })).toBe(0);
		expect(guarddogExitCode({ issues: 10, errors: {}, risks: [] })).toBe(1);
		expect(
			guarddogExitCode({
				issues: 1,
				errors: {},
				risks: [{ name: "exfiltration" }],
			}),
		).toBe(1);
	});

	it("continues after findings and scanner exceptions", async () => {
		const results = await runChecks(
			["findings", "broken", "healthy"],
			(check) => {
				if (check === "broken") {
					throw new Error("scanner unavailable");
				}
				return Promise.resolve(check === "healthy" ? 0 : 1);
			},
		);
		expect(results.map((result) => result.exitCode)).toStrictEqual([1, 2, 0]);
	});

	it("captures reports and fails if a tool is missing", async () => {
		const directory = mkdtempSync(path.join(tmpdir(), "jwc-security-test-"));
		const context = { directory, root: directory, name: "success", env: {} };
		try {
			await expect(
				execute(
					process.execPath,
					["-e", "console.log(JSON.stringify({ok:true}))"],
					context,
				),
			).resolves.toBe(0);
			expect(
				JSON.parse(readFileSync(path.join(directory, "success.json"), "utf-8")),
			).toStrictEqual({ ok: true });
			await expect(
				execute(path.join(directory, "missing-tool"), [], {
					...context,
					name: "missing",
				}),
			).resolves.toBe(2);
			expect(
				readFileSync(path.join(directory, "missing.log"), "utf-8"),
			).toContain("ENOENT");
		} finally {
			rmSync(directory, { recursive: true, force: true });
		}
	});

	it("preserves nonzero tool exits and fails on a timeout", async () => {
		const directory = mkdtempSync(path.join(tmpdir(), "jwc-security-timeout-"));
		const context = { directory, root: directory, name: "nonzero", env: {} };
		try {
			await expect(
				execute(process.execPath, ["-e", "process.exitCode=3"], context),
			).resolves.toBe(3);
			await expect(
				execute(process.execPath, ["-e", "setInterval(()=>{},1000)"], {
					...context,
					name: "timeout",
					timeout: 25,
				}),
			).resolves.toBe(2);
		} finally {
			rmSync(directory, { recursive: true, force: true });
		}
	});
});
