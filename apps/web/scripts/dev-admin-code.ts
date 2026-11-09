import { loadDevAdminContext } from "./dev-admin-context";
import {
	deriveDevTotpSecret,
	secondsUntilNextCode,
	totpCode,
} from "./dev-admin-totp";

/**
 * `db:seed-admin`으로 만든 로컬 개발 관리자의 현재 2단계 인증 코드를 출력한다.
 *
 *   pnpm -C apps/web db:admin-code                     # ADMIN_EMAILS의 첫 번째 이메일
 *   pnpm -C apps/web db:admin-code -- --email a@b.com  # 특정 이메일
 *
 * DB를 읽지 않고 seed와 같은 파생 키로 계산한다. 화면에서 2단계 인증을 다시 등록했다면
 * 키가 달라지므로 `db:seed-admin`을 다시 실행한다. seed와 같은 로컬 전용 확인을 거친다.
 */

function main(): void {
	const { admin, authSecret } = loadDevAdminContext(process.argv.slice(2));
	const now = Date.now();
	const code = totpCode(deriveDevTotpSecret(authSecret, admin.email), now);
	process.stdout.write(
		`${code}  (${admin.email}, ${secondsUntilNextCode(now)}초 후 바뀜)\n`,
	);
}

try {
	main();
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
	process.stderr.write(`2단계 코드 출력 실패: ${message}\n`);
	process.exitCode = 1;
}
