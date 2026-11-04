import { getRequestHeaders } from "@tanstack/react-start/server";

import { getAuth, isAllowedAdmin } from "./auth";
import { UnauthorizedError } from "./errors";

export interface AdminUser {
	email: string;
	id: string;
	name: string;
}

/** 세션이 있고, 현재도 허용 목록에 있는 관리자만 반환 (목록에서 빠지면 즉시 접근 차단) */
export async function currentAdmin(): Promise<AdminUser | null> {
	const session = await getAuth().api.getSession({
		headers: getRequestHeaders(),
	});
	if (!(session && isAllowedAdmin(session.user.email))) {
		return null;
	}
	return {
		id: session.user.id,
		email: session.user.email,
		name: session.user.name,
	};
}

export async function requireAdmin(): Promise<AdminUser> {
	const admin = await currentAdmin();
	if (!admin) {
		throw new UnauthorizedError();
	}
	return admin;
}
