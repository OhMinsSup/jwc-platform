import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";

import { getAdminSessionFn } from "../../../features/admin-access/functions";
import { identifyAdmin } from "../../../platform/analytics/client";
import { AdminShell } from "../../../platform/ui/admin-shell";

/** /admin/* 보호 레이아웃. 서버에서 세션 + 허용 목록을 검사한다. */
export const Route = createFileRoute("/admin/_console")({
	beforeLoad: async () => {
		const admin = await getAdminSessionFn();
		if (!admin) {
			throw redirect({ to: "/admin/login" });
		}
		return { admin };
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
