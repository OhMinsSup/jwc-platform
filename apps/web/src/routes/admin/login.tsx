import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { getAdminAccessFn } from "../../features/admin-access/functions";
import { ADMIN_AUTH_DESTINATIONS } from "../../features/admin-access/model/admin-auth";
import { authClient } from "../../platform/auth-client";
import { AuthCard } from "../../platform/ui/auth-card";
import type { AuthFieldDef } from "../../platform/ui/auth-card";

const LOGIN_FIELDS: AuthFieldDef[] = [
	{ name: "email", label: "이메일", type: "email", autoComplete: "email" },
	{
		name: "password",
		label: "비밀번호",
		type: "password",
		autoComplete: "current-password",
	},
];

export const Route = createFileRoute("/admin/login")({
	head: () => ({ meta: [{ title: "관리자 로그인" }] }),
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();
	return (
		<AuthCard
			description="허용된 관리자 계정으로 로그인하세요."
			fields={LOGIN_FIELDS}
			footer={<LoginLinks />}
			onSubmit={async ({ email = "", password = "" }) => {
				const { data, error } = await authClient.signIn.email({
					email,
					password,
				});
				if (error) {
					return "로그인하지 못했습니다. 입력값을 확인하거나 잠시 후 다시 시도해주세요";
				}
				if ("twoFactorRedirect" in data && data.twoFactorRedirect === true) {
					await navigate({ to: "/admin/two-factor" });
					return null;
				}
				const decision = await getAdminAccessFn();
				if (decision.kind === "blocked") {
					return "이 계정에는 관리자 접근 권한이 없습니다. 관리자에게 계정 등록을 확인해주세요";
				}
				if (decision.kind === "signed_out") {
					return "로그인 세션을 확인하지 못했습니다. 쿠키 허용 설정과 접속 주소를 확인한 뒤 다시 로그인해주세요";
				}
				await navigate({ to: ADMIN_AUTH_DESTINATIONS[decision.kind] });
				return null;
			}}
			submitLabel="로그인"
			title="관리자 로그인"
		/>
	);
}

function LoginLinks() {
	return (
		<div className="text-muted-foreground flex flex-col gap-3 text-center text-sm">
			<p>
				처음이신가요?{" "}
				<Link
					className="text-foreground font-semibold underline-offset-4 hover:underline"
					to="/admin/signup"
				>
					관리자 가입
				</Link>
			</p>
			<Link to="/admin/forgot-password">비밀번호를 잊으셨나요?</Link>
		</div>
	);
}
