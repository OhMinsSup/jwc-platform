import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";

import { getAdminAccessFn } from "../../../features/admin-access/functions";
import { ADMIN_AUTH_DESTINATIONS } from "../../../features/admin-access/model/admin-auth";
import { adminAccessCache } from "../../../features/admin-access/ui/admin-access-cache";
import { identifyAdmin } from "../../../platform/analytics/client";
import { AdminShell } from "../../../platform/ui/admin-shell";

/**
 * /admin/* 보호 레이아웃. 서버에서 세션 + 허용 목록을 검사한다.
 * beforeLoad는 이동·미리 불러오기·invalidate마다 돌기 때문에, 브라우저에서는 최근 확인 결과를
 * 재사용한다(admin-access-cache.ts). 데이터 접근은 각 서버 함수의 adminOnly가 매번 검사한다.
 */
export const Route = createFileRoute("/admin/_console")({
	beforeLoad: async () => {
		const cached = adminAccessCache.read(Date.now());
		if (cached) {
			return { admin: cached };
		}
		const decision = await getAdminAccessFn();
		if (decision.kind !== "ready") {
			throw redirect({ to: ADMIN_AUTH_DESTINATIONS[decision.kind] });
		}
		adminAccessCache.remember(decision.admin, Date.now());
		return { admin: decision.admin };
	},
	component: ConsoleLayout,
});

function ConsoleLayout() {
	const { admin } = Route.useRouteContext();
	// 서버 세션에서 확인한 관리자를 브라우저 쪽 상태(분석 SDK 식별, 접근 확인 캐시)와 동기화한다.
	// 첫 화면은 SSR에서 확인하므로 캐시가 비어 있다. 여기서 채워 다음 이동의 재확인 요청을 줄인다.
	useEffect(() => {
		identifyAdmin(admin.id);
		adminAccessCache.remember(admin, Date.now());
	}, [admin]);
	return (
		<AdminShell admin={admin}>
			<Outlet />
		</AdminShell>
	);
}
