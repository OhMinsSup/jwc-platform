import { identifyScope } from "@jwc/observability/scope";
import { redirect } from "@tanstack/react-router";
import { getRequestHeaders } from "@tanstack/react-start/server";

import { decideAdminAccess } from "../domain/admin-auth-state";
import type {
	AdminAccessDecision,
	AdminIdentity,
} from "../domain/admin-auth-state";
import { ADMIN_AUTH_DESTINATIONS } from "../model/admin-auth";
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

/**
 * 관리자 서버 함수의 접근 검사. 준비되지 않았으면 해당 인증 화면으로 redirect를 던진다.
 * 던진 오류는 클라이언트에 메시지만 전달되지만 redirect는 그대로 전달되어, loader 안에서는
 * 라우터가 따라간다 (세션 만료 시 로그인 화면으로). 콘솔의 접근 확인 캐시가 이 동작에 기댄다.
 */
export async function requireAdmin(): Promise<AdminIdentity> {
	const decision = await currentAdminAccess();
	if (decision.kind !== "ready") {
		// oxlint-disable-next-line typescript/only-throw-error -- TanStack redirect는 던져서 전달하는 것이 계약이다
		throw redirect({ to: ADMIN_AUTH_DESTINATIONS[decision.kind] });
	}
	return decision.admin;
}
