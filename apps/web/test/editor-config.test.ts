import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vite-plus/test";
import { z } from "zod";

const ROOT = new URL("../../../", import.meta.url);

function readConfig(file: string) {
	return JSON.parse(readFileSync(new URL(file, ROOT), "utf-8")) as unknown;
}

describe("에디터의 프로젝트 도구 연결", () => {
	it("VS Code는 설치된 네이티브 TypeScript SDK를 선택한다", () => {
		const settings = z
			.object({
				"js/ts.experimental.useTsgo": z.literal(true),
				"js/ts.tsdk.path": z.string(),
			})
			.parse(readConfig(".vscode/settings.json"));
		const sdk = new URL(`${settings["js/ts.tsdk.path"]}/`, ROOT);
		const pkg = z
			.object({ name: z.literal("typescript"), version: z.string() })
			.parse(JSON.parse(readFileSync(new URL("package.json", sdk), "utf-8")));
		expect(Number(pkg.version.split(".")[0])).toBeGreaterThanOrEqual(7);
		expect(existsSync(new URL("bin/tsc", sdk))).toBe(true);
	});

	it("Zed는 별도 SDK 다운로드 없이 프로젝트의 네이티브 서버를 사용한다", () => {
		const { lsp, languages } = z
			.object({
				lsp: z.object({
					"typescript-ls": z.object({
						binary: z.object({
							path: z.string(),
							arguments: z.array(z.string()),
						}),
					}),
				}),
				languages: z.record(
					z.string(),
					z.object({ language_servers: z.array(z.string()).optional() }),
				),
			})
			.parse(readConfig(".zed/settings.json"));
		const { binary } = lsp["typescript-ls"];
		expect(existsSync(new URL(binary.path, ROOT))).toBe(true);
		expect(binary.arguments).toStrictEqual(["--lsp", "--stdio"]);
		for (const name of ["JavaScript", "JSX", "TypeScript", "TSX"]) {
			const servers = languages[name]?.language_servers;
			expect(servers?.[0]).toBe("typescript-ls");
			expect(servers).toStrictEqual(
				expect.arrayContaining([
					"!vtsls",
					"!typescript-language-server",
					"...",
				]),
			);
		}
	});

	it("앱·공용 패키지 모두 같은 루트 린트·포맷 설정을 읽는다", () => {
		const vscode = z
			.object({
				"oxc.configPath": z.string(),
				"oxc.fmt.configPath": z.string(),
				"oxc.fixKind": z.literal("safe_fix"),
			})
			.parse(readConfig(".vscode/settings.json"));
		const zed = z
			.object({
				lsp: z.object({
					oxlint: z.object({
						initialization_options: z.object({
							settings: z.object({
								configPath: z.string(),
								fixKind: z.literal("safe_fix"),
							}),
						}),
					}),
					oxfmt: z.object({
						initialization_options: z.object({
							settings: z.object({ "fmt.configPath": z.string() }),
						}),
					}),
				}),
			})
			.parse(readConfig(".zed/settings.json"));
		const paths = [
			vscode["oxc.configPath"],
			vscode["oxc.fmt.configPath"],
			zed.lsp.oxlint.initialization_options.settings.configPath,
			zed.lsp.oxfmt.initialization_options.settings["fmt.configPath"],
		];
		for (const file of paths) {
			// VS Code가 실행할 때 치환하는 변수이며 JavaScript 보간이 아니다.
			// oxlint-disable-next-line no-template-curly-in-string -- 에디터 경로 변수의 리터럴을 해석한다.
			const relative = file.replace("${workspaceFolder}/", "");
			expect(new URL(relative, ROOT).href).toBe(
				new URL("vite.config.ts", ROOT).href,
			);
		}
	});
});
