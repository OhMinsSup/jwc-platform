import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";

import { getAdminAccessFn } from "../../../features/admin-access/functions";
import { ADMIN_AUTH_DESTINATIONS } from "../../../features/admin-access/model/admin-auth";
import { identifyAdmin } from "../../../platform/analytics/client";
import { AdminShell } from "../../../platform/ui/admin-shell";

/** /admin/* 보호 레이아웃. 서버에서 세션 + 허용 목록을 검사한다. */
export const Route = createFileRoute("/admin/_console")({
	beforeLoad: async () => {
		const decision = await getAdminAccessFn();
		if (decision.kind !== "ready") {
			throw redirect({ to: ADMIN_AUTH_DESTINATIONS[decision.kind] });
		}
		return { admin: decision.admin };
	},
	component: ConsoleLayout,
});

function ConsoleLayout() {
	const { admin } = Route.useRouteContext();
	useEffect(() => {
		identifyAdmin(admin.id);
	}, [admin.id]);
	return (
		<AdminShell admin={admin}>
			<Outlet />
		</AdminShell>
	);
}
