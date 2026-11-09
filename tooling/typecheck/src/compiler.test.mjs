import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vite-plus/test";

import { selectCompiler } from "./compiler.mjs";

const VERIFIED_PLATFORMS = [
	["darwin", "arm64"],
	["linux", "x64"],
	["linux", "arm64"],
];
const FALLBACK_PLATFORMS = [
	["win32", "x64"],
	["win32", "arm64"],
	["darwin", "x64"],
	["linux", "arm"],
	["freebsd", "x64"],
];
const TYPE_ERROR_EXIT_CODE = 2;

describe(selectCompiler, () => {
	it.each(VERIFIED_PLATFORMS)("uses tsrs on %s-%s", (platform, arch) => {
		expect(selectCompiler(platform, arch)).toBe("tsrs");
	});

	it.each(FALLBACK_PLATFORMS)(
		"falls back to tsc on %s-%s",
		(platform, arch) => {
			expect(selectCompiler(platform, arch)).toBe("typescript");
		},
	);
});

describe("cli", () => {
	it("forwards project paths, reports type errors and emits no JavaScript", () => {
		const directory = mkdtempSync(path.join(tmpdir(), "jwc-typecheck-"));
		try {
			writeFileSync(
				path.join(directory, "tsconfig.json"),
				'{"files":["input.ts"]}',
			);
			const input = path.join(directory, "input.ts");
			const cli = fileURLToPath(new URL("cli.mjs", import.meta.url));
			const args = [
				cli,
				"--noEmit",
				"-p",
				path.join(directory, "tsconfig.json"),
			];

			writeFileSync(input, 'const value: string = "valid";');
			const valid = spawnSync(process.execPath, args, { encoding: "utf-8" });
			// 실패 시 diff에 stdout/stderr가 함께 보이도록 결과 전체를 비교한다
			expect(valid).toMatchObject({ status: 0 });
			expect(existsSync(path.join(directory, "input.js"))).toBe(false);

			writeFileSync(input, "const value: string = 123;");
			const invalid = spawnSync(process.execPath, args, { encoding: "utf-8" });
			expect(invalid).toMatchObject({ status: TYPE_ERROR_EXIT_CODE });
			expect(invalid.stdout).toContain("TS2322");
		} finally {
			rmSync(directory, { force: true, recursive: true });
		}
	});
});
