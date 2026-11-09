import { rmSync } from "node:fs";

import { seedSql } from "../seed";
import { executePerformanceSql } from "./database";
import { PERFORMANCE_ACCOUNTS } from "./settings";

const SESSION_LIFETIME_MS = 86_400_000;

export default function setup() {
	const now = Date.now();
	const accounts = Object.entries(PERFORMANCE_ACCOUNTS).flatMap(
		([kind, account]) => [
			`DELETE FROM user WHERE id = 'performance-${kind}';`,
			`INSERT INTO user (id, name, email, email_verified, phone_number, phone_number_verified, two_factor_enabled, bootstrap_admin, created_at, updated_at) VALUES ('performance-${kind}', '성능 검사 관리자', '${account.email}', 0, '${account.phone}', 1, ${kind === "ready" ? 1 : 0}, ${kind === "ready" ? 1 : 0}, ${now}, ${now});`,
			`INSERT INTO session (id, token, user_id, expires_at, created_at, updated_at) VALUES ('performance-${kind}', '${account.token}', 'performance-${kind}', ${now + SESSION_LIFETIME_MS}, ${now}, ${now});`,
		],
	);
	executePerformanceSql(
		`DELETE FROM rate_limit_buckets;\n${seedSql(now)}\n${accounts.join("\n")}`,
	);
	return () => rmSync(".void/local-d1.json", { force: true });
}
