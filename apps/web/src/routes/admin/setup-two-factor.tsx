import { createFileRoute, redirect } from "@tanstack/react-router";

import { getAdminAccessFn } from "../../features/admin-access/functions";
import { ADMIN_AUTH_DESTINATIONS } from "../../features/admin-access/model/admin-auth";
import { TwoFactorSetup } from "../../features/admin-access/ui/two-factor-setup";

export const Route = createFileRoute("/admin/setup-two-factor")({
	head: () => ({ meta: [{ title: "2단계 인증 등록" }] }),
	beforeLoad: async () => {
		const decision = await getAdminAccessFn();
		if (decision.kind !== "setup_two_factor") {
			throw redirect({ to: ADMIN_AUTH_DESTINATIONS[decision.kind] });
		}
	},
	component: TwoFactorSetup,
});
