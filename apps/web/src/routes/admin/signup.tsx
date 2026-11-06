import { createFileRoute } from "@tanstack/react-router";

import { SignupFlow } from "../../features/admin-access/ui/signup-flow";

export const Route = createFileRoute("/admin/signup")({
	head: () => ({ meta: [{ title: "관리자 가입" }] }),
	component: SignupFlow,
});
