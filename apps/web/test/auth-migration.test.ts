import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

import { describe, expect, it } from "vite-plus/test";

function migratedDatabase() {
	const db = new DatabaseSync(":memory:");
	const directory = new URL("../db/migrations/", import.meta.url);
	for (const file of readdirSync(directory)
		.filter((name) => name.endsWith(".sql"))
		.toSorted()) {
		db.exec(readFileSync(new URL(file, directory), "utf-8"));
	}
	return db;
}

describe("인증 스키마 마이그레이션", () => {
	it("두 요청이 모두 계정 0개로 판단해도 최초 관리자는 하나만 저장된다", () => {
		const db = migratedDatabase();
		try {
			const insert = db.prepare(
				"INSERT INTO user (id, name, email, created_at, updated_at, bootstrap_admin) VALUES (?, '관리자', ?, 0, 0, ?)",
			);
			insert.run("first", "first@example.org", 1);
			expect(() => insert.run("second", "second@example.org", 1)).toThrow(
				/UNIQUE/u,
			);
			insert.run("invited", "invited@example.org", 0);
			expect(
				db.prepare("SELECT count(*) AS total FROM user").get(),
			).toMatchObject({ total: 2 });
		} finally {
			db.close();
		}
	});

	it("인증 필드 기본값은 미인증이며 TOTP 비밀은 사용자 삭제 시 함께 삭제된다", () => {
		const db = migratedDatabase();
		try {
			db.prepare(
				"INSERT INTO user (id, name, email, created_at, updated_at) VALUES ('admin', '관리자', 'admin@example.org', 0, 0)",
			).run();
			expect(
				db.prepare("SELECT email_verified, two_factor_enabled FROM user").get(),
			).toMatchObject({ email_verified: 0, two_factor_enabled: 0 });
			db.prepare(
				"INSERT INTO two_factor (id, user_id, secret, backup_codes, verified) VALUES ('factor', 'admin', 'encrypted-secret', 'encrypted-codes', 0)",
			).run();
			db.prepare("DELETE FROM user WHERE id = 'admin'").run();
			expect(
				db.prepare("SELECT count(*) AS total FROM two_factor").get(),
			).toMatchObject({ total: 0 });
		} finally {
			db.close();
		}
	});
});
