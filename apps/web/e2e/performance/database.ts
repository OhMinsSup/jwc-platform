import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { z } from "zod";

import { PERFORMANCE_PERSISTENCE } from "./settings";

export function executePerformanceSql(sql: string) {
	const state: unknown = JSON.parse(
		readFileSync(".void/local-d1.json", "utf-8"),
	);
	const { persistRoot } = z.object({ persistRoot: z.string() }).parse(state);
	if (persistRoot !== path.resolve(PERFORMANCE_PERSISTENCE)) {
		throw new Error("성능 검사 전용 D1이 아닙니다. 데이터 변경을 중단합니다.");
	}
	const directory = mkdtempSync(path.join(tmpdir(), "jwc-performance-"));
	const file = path.join(directory, "seed.sql");
	try {
		writeFileSync(file, sql);
		execFileSync("pnpm", ["exec", "void", "db", "migrate"], { stdio: "pipe" });
		execFileSync("pnpm", ["exec", "void", "db", "execute", "--file", file], {
			stdio: "pipe",
		});
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
}
