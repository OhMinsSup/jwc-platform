import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { signUpAdminFn } from "../../features/admin-access/functions";
import { ADMIN_PASSWORD_MIN_LENGTH } from "../../features/admin-access/model/admin-access";
import { AuthCard } from "../../platform/ui/auth-card";
import type { AuthFieldDef } from "../../platform/ui/auth-card";

export const Route = createFileRoute("/admin/signup")({
	head: () => ({ meta: [{ title: "관리자 가입" }] }),
	component: SignupPage,
});

/** 가입 입력 항목 (AuthCard가 데이터로 받는다) */
const SIGNUP_FIELDS: AuthFieldDef[] = [
	{ name: "name", label: "이름", type: "text", autoComplete: "name" },
	{
		name: "email",
		label: "이메일",
		type: "email",
		autoComplete: "email",
		hint: "초대받은 이메일 주소를 입력하세요",
	},
	{
		name: "password",
		label: "비밀번호",
		type: "password",
		autoComplete: "new-password",
		minLength: ADMIN_PASSWORD_MIN_LENGTH,
		hint: `${ADMIN_PASSWORD_MIN_LENGTH}자 이상`,
	},
	{
		name: "inviteCode",
		label: "초대 코드",
		type: "text",
		autoComplete: "off",
		optional: true,
		hint: "관리자 화면에서 발급한 코드입니다. 첫 관리자를 만들 때만 비워 둡니다",
	},
];

function SignupPage() {
	const navigate = useNavigate();
	return (
		<AuthCard
			description="기존 관리자에게 받은 초대 코드로 가입합니다."
			fields={SIGNUP_FIELDS}
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
			onSubmit={async ({
				name = "",
				email = "",
				password = "",
				inviteCode = "",
			}) => {
				const result = await signUpAdminFn({
					data: { name, email, password, inviteCode },
				});
				if (!result.ok) {
					return result.message;
				}
				await navigate({ to: "/admin" });
				return null;
			}}
			submitLabel="가입하기"
			title="관리자 가입"
		/>
	);
}
