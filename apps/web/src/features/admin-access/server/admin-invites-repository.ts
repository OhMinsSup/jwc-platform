import { adminInvites, user } from "@schema";
import { and, count, db, desc, eq, gt, isNull } from "void/db";

/**
 * 관리자 초대(D1) + 가입 판단에 필요한 계정 사실(Better Auth user 테이블).
 * 코드 해시는 조회 결과로 내보내지 않는다.
 */

export type InviteInsert = typeof adminInvites.$inferInsert;

export interface InviteListRow {
	createdAt: number;
	email: string;
	expiresAt: number;
	id: string;
	usedAt: number | null;
}

export async function insertInvite(row: InviteInsert): Promise<void> {
	await db.insert(adminInvites).values(row);
}

/**
 * 원자적 사용 처리. 코드·이메일이 맞고, 아직 쓰지 않았고, 만료 전인 초대만 한 번 성공한다.
 * 동시에 같은 코드로 가입해도 한 요청만 행을 돌려받는다. 실패하면 null.
 */
export async function claimInvite(input: {
	codeHash: string;
	email: string;
	now: number;
}): Promise<string | null> {
	const rows = await db
		.update(adminInvites)
		.set({ usedAt: input.now })
		.where(
			and(
				eq(adminInvites.codeHash, input.codeHash),
				eq(adminInvites.email, input.email),
				isNull(adminInvites.usedAt),
				gt(adminInvites.expiresAt, input.now),
			),
		)
		.returning({ id: adminInvites.id });
	return rows[0]?.id ?? null;
}

/** 가입이 실패했을 때 사용 처리를 되돌린다 (같은 코드로 다시 시도할 수 있게) */
export async function unclaimInvite(id: string): Promise<void> {
	await db
		.update(adminInvites)
		.set({ usedAt: null })
		.where(eq(adminInvites.id, id));
}

export async function listRecentInvites(
	limit: number,
): Promise<InviteListRow[]> {
	return await db
		.select({
			id: adminInvites.id,
			email: adminInvites.email,
			createdAt: adminInvites.createdAt,
			expiresAt: adminInvites.expiresAt,
			usedAt: adminInvites.usedAt,
		})
		.from(adminInvites)
		.orderBy(desc(adminInvites.createdAt))
		.limit(limit);
}

/** 첫 관리자 부트스트랩 판단용 계정 수 */
export async function countUsers(): Promise<number> {
	const row = await db.select({ total: count() }).from(user).get();
	return row?.total ?? 0;
}

export async function userExistsByEmail(email: string): Promise<boolean> {
	const row = await db
		.select({ id: user.id })
		.from(user)
		.where(eq(user.email, email))
		.get();
	return row !== undefined;
}
