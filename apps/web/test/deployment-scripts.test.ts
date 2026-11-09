import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vite-plus/test";
import { z } from "zod";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const PRODUCTION_ENV = "config/env/production/.env";
const SCRIPTS = z.object({ scripts: z.record(z.string(), z.string()) });

function scriptsOf(relativePath: string) {
	const file = new URL(`../../../${relativePath}`, import.meta.url);
	return SCRIPTS.parse(JSON.parse(readFileSync(file, "utf-8"))).scripts;
}

/** env.ts에 선언된 키 (void secret sync는 선언되지 않은 키를 거절한다) */
function declaredEnvKeys() {
	const source = readFileSync(new URL("../env.ts", import.meta.url), "utf-8");
	return new Set(
		[...source.matchAll(/^\t(?<key>[A-Z][A-Z0-9_]*):/gmu)].map(
			(m) => m.groups?.key,
		),
	);
}

/** 예시 파일의 키 이름만 (값은 읽지 않는다) */
function exampleKeys() {
	const source = readFileSync(`${ROOT}${PRODUCTION_ENV}.example`, "utf-8");
	return [...source.matchAll(/^(?<key>[A-Z][A-Z0-9_]*)=/gmu)].map(
		(m) => m.groups?.key,
	);
}

describe("운영 비밀값 동기화와 배포 스크립트", () => {
	it("env:sync는 운영 파일 하나만 Worker Secrets로 올린다", () => {
		expect(scriptsOf("apps/web/package.json")["env:sync"]).toBe(
			`void secret sync ../../${PRODUCTION_ENV}`,
		);
	});

	it("deploy:production은 동기화가 성공한 뒤에만 배포한다", () => {
		// `pnpm deploy`는 pnpm 내장 명령이라 스크립트를 부르려면 `pnpm run`이 필요하다.
		expect(scriptsOf("apps/web/package.json")["deploy:production"]).toBe(
			"pnpm run env:sync && pnpm run deploy",
		);
	});

	it("루트에서도 같은 이름으로 앱 스크립트를 부른다", () => {
		const root = scriptsOf("package.json");
		expect(root["env:sync"]).toBe("pnpm -C apps/web run env:sync");
		expect(root["deploy:production"]).toBe(
			"pnpm -C apps/web run deploy:production",
		);
	});

	it("운영 파일은 Git 추적에서 빠져 있다", () => {
		const ignored = spawnSync("git", ["check-ignore", "-q", PRODUCTION_ENV], {
			cwd: ROOT,
		});
		expect(ignored.status).toBe(0);
	});

	it("운영 예시의 모든 키가 env.ts에 선언돼 동기화에서 거절되지 않는다", () => {
		const declared = declaredEnvKeys();
		const keys = exampleKeys();
		expect(keys.length).toBeGreaterThan(0);
		expect(keys.filter((key) => !declared.has(key))).toStrictEqual([]);
	});
});
