import { identifyScope } from "@jwc/observability/scope";
import { getRequestHeaders } from "@tanstack/react-start/server";

import { UnauthorizedError } from "../../../platform/server/errors/unauthorized-error";
import { decideAdminAccess } from "../domain/admin-auth-state";
import type {
	AdminAccessDecision,
	AdminIdentity,
} from "../domain/admin-auth-state";
import { adminRegistration, getAuth } from "./auth";

/** 매 요청에서 세션과 현재 등록 정보로 접근 결정을 계산한다. */
export async function currentAdminAccess(): Promise<AdminAccessDecision> {
	const session = await getAuth().api.getSession({
		headers: getRequestHeaders(),
	});
	if (session) {
		identifyScope(session.user.id);
	}
	return decideAdminAccess({
		user: session?.user ?? null,
		registration: session ? adminRegistration(session.user.email) : null,
	});
}

export async function requireAdmin(): Promise<AdminIdentity> {
	const decision = await currentAdminAccess();
	if (decision.kind !== "ready") {
		throw new UnauthorizedError();
	}
	return decision.admin;
}
