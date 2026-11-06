import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { z } from "zod";

export function assertE2EDatabase() {
	const state: unknown = JSON.parse(
		readFileSync(".void/local-d1.json", "utf-8"),
	);
	const persistence = z.object({ persistRoot: z.string() }).parse(state);
	if (persistence.persistRoot !== path.resolve(".void/e2e")) {
		throw new Error(
			"E2E 전용 저장소가 아닙니다. --mode e2e 서버가 먼저 시작되어야 합니다",
		);
	}
}

export function executeE2ESql(sql: string) {
	assertE2EDatabase();
	const directory = mkdtempSync(path.join(tmpdir(), "jwc-e2e-auth-"));
	const file = path.join(directory, "seed.sql");
	try {
		writeFileSync(file, sql);
		execFileSync("pnpm", ["exec", "void", "db", "execute", "--file", file], {
			stdio: "pipe",
		});
	} finally {
		rmSync(directory, { force: true, recursive: true });
	}
}
