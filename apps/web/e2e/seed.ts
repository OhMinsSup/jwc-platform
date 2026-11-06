import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { parseFormDefinition } from "@jwc/form-core/definition/definition";

import { adminSeedSql } from "./auth-fixture";
import { assertE2EDatabase } from "./database";
import { E2E_DEFINITION, E2E_FORM } from "./fixture";

const PUBLISHED_BY = "e2e";

/** SQL 문자열 리터럴 (작은따옴표 두 번) */
const sqlText = (value: string) => `'${value.replaceAll("'", "''")}'`;

/** E2E 폼만 지우고(응답 키·발송 기록 포함) 발행 상태로 다시 넣는 SQL */
export function seedSql(now: number): string {
	const parsed = parseFormDefinition(E2E_DEFINITION);
	if (!parsed.ok) {
		throw new Error(
			`E2E 폼 정의가 올바르지 않습니다: ${JSON.stringify(parsed.issues)}`,
		);
	}
	const definition = sqlText(JSON.stringify(parsed.definition));
	const id = sqlText(E2E_FORM.id);
	const versionId = sqlText(E2E_FORM.versionId);
	return [
		`DELETE FROM message_log WHERE submission_id IN (SELECT id FROM submission_keys WHERE form_id = ${id});`,
		`DELETE FROM submission_keys WHERE form_id = ${id};`,
		`DELETE FROM form_versions WHERE form_id = ${id};`,
		`DELETE FROM forms WHERE id = ${id};`,
		`INSERT INTO forms (id, slug, status, draft_definition, published_version_id, sheet_name, created_at, updated_at) VALUES (${id}, ${sqlText(E2E_FORM.slug)}, 'open', ${definition}, ${versionId}, ${sqlText(E2E_FORM.sheetName)}, ${now}, ${now});`,
		`INSERT INTO form_versions (id, form_id, version, definition, published_at, published_by) VALUES (${versionId}, ${id}, 1, ${definition}, ${now}, ${sqlText(PUBLISHED_BY)});`,
	].join("\n");
}

/** Playwright globalSetup: 로컬 D1에 마이그레이션을 적용하고 E2E 폼을 넣는다 (다른 데이터는 건드리지 않는다) */
export default async function globalSetup() {
	assertE2EDatabase();
	const dir = mkdtempSync(path.join(tmpdir(), "jwc-e2e-"));
	const file = path.join(dir, "seed.sql");
	try {
		const now = Date.now();
		writeFileSync(file, `${seedSql(now)}\n${await adminSeedSql(now)}`);
		execFileSync("pnpm", ["exec", "void", "db", "migrate"], {
			stdio: "inherit",
		});
		execFileSync("pnpm", ["exec", "void", "db", "execute", "--file", file], {
			stdio: "inherit",
		});
	} finally {
		rmSync(dir, { force: true, recursive: true });
	}
	return () => {
		rmSync(".void/local-d1.json", { force: true });
	};
}
