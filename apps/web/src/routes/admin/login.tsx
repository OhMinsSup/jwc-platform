import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { authClient } from "../../platform/auth-client";
import { AuthCard } from "../../platform/ui/auth-card";

export const Route = createFileRoute("/admin/login")({
	head: () => ({ meta: [{ title: "관리자 로그인" }] }),
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();
	return (
		<AuthCard
			description="허용된 관리자 계정으로 로그인하세요."
			fields={[
				{
					name: "email",
					label: "이메일",
					type: "email",
					autoComplete: "email",
				},
				{
					name: "password",
					label: "비밀번호",
					type: "password",
					autoComplete: "current-password",
				},
			]}
			footer={
				<p className="text-muted-foreground text-center text-sm">
					처음이신가요?{" "}
					<Link
						className="text-brand font-medium hover:underline"
						to="/admin/signup"
					>
						관리자 가입
					</Link>
				</p>
			}
			onSubmit={async ({ email = "", password = "" }) => {
				const { error } = await authClient.signIn.email({ email, password });
				if (error) {
					return error.message ?? "이메일 또는 비밀번호가 올바르지 않습니다";
				}
				await navigate({ to: "/admin" });
				return null;
			}}
			submitLabel="로그인"
			title="관리자 로그인"
		/>
	);
}
