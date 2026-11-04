import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { AuthCard } from "../../components/auth-card";
import { authClient } from "../../lib/auth-client";

export const Route = createFileRoute("/admin/signup")({
	head: () => ({ meta: [{ title: "관리자 가입" }] }),
	component: SignupPage,
});

function SignupPage() {
	const navigate = useNavigate();
	return (
		<AuthCard
			description="처음 한 번만 필요합니다."
			fields={[
				{ name: "name", label: "이름", type: "text", autoComplete: "name" },
				{
					name: "email",
					label: "이메일",
					type: "email",
					autoComplete: "email",
					hint: "관리자 허용 목록에 등록된 주소만 가입할 수 있습니다",
				},
				{
					name: "password",
					label: "비밀번호",
					type: "password",
					autoComplete: "new-password",
					hint: "10자 이상",
				},
			]}
			footer={
				<p className="text-muted-foreground text-center text-sm">
					<Link
						className="text-brand font-medium hover:underline"
						to="/admin/login"
					>
						이미 계정이 있다면 로그인
					</Link>
				</p>
			}
			onSubmit={async ({ name = "", email = "", password = "" }) => {
				const { error } = await authClient.signUp.email({
					name,
					email,
					password,
				});
				if (error) {
					return error.message ?? "가입할 수 없습니다";
				}
				await navigate({ to: "/admin" });
				return null;
			}}
			submitLabel="가입하기"
			title="관리자 가입"
		/>
	);
}
