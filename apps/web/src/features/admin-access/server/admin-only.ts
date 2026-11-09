import { createMiddleware } from "@tanstack/react-start";

import { requireAdmin } from "./session";

/** 모든 관리자 서버 함수 앞단: 세션 + 허용 목록 검사. context.admin으로 현재 관리자를 넘긴다 */
export const adminOnly = createMiddleware({ type: "function" }).server(
	async ({ next }) => await next({ context: { admin: await requireAdmin() } }),
);
