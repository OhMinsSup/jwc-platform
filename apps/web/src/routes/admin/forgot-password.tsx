import { Button } from "@jwc/ui/components/button";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { ADMIN_AUTH_POLICY } from "../../features/admin-access/domain/admin-auth-policy";
import {
	requestAdminPasswordResetFn,
	resetAdminPasswordFn,
} from "../../features/admin-access/functions-phone";
import { ADMIN_SMS_CODE_FIELD } from "../../features/admin-access/model/admin-auth";
import { AuthCard } from "../../platform/ui/auth-card";
import type { AuthFieldDef } from "../../platform/ui/auth-card";

const IDENTITY_FIELDS: AuthFieldDef[] = [
	{ name: "email", label: "가입 이메일", type: "email", autoComplete: "email" },
	{
		name: "phoneNumber",
		label: "휴대전화 번호",
		type: "tel",
		autoComplete: "tel",
		maxLength: 32,
	},
];
const RESET_FIELDS: AuthFieldDef[] = [
	ADMIN_SMS_CODE_FIELD,
	{
		name: "password",
		label: "새 비밀번호",
		type: "password",
		autoComplete: "new-password",
		minLength: ADMIN_AUTH_POLICY.password.minLength,
		maxLength: ADMIN_AUTH_POLICY.password.maxLength,
	},
];

export const Route = createFileRoute("/admin/forgot-password")({
	component: ForgotPasswordPage,
});

function usePasswordReset() {
	const [identity, setIdentity] = useState<{
		email: string;
		phoneNumber: string;
	} | null>(null);
	const navigate = useNavigate();
	async function submit(values: Record<string, string>) {
		if (!identity) {
			const input = {
				email: values.email ?? "",
				phoneNumber: values.phoneNumber ?? "",
			};
			const result = await requestAdminPasswordResetFn({ data: input });
			if (!result.ok) {
				return result.message;
			}
			setIdentity(input);
			return null;
		}
		const result = await resetAdminPasswordFn({
			data: {
				...identity,
				code: values.code ?? "",
				password: values.password ?? "",
			},
		});
		if (!result.ok) {
			return result.message;
		}
		await navigate({ to: "/admin/login" });
		return null;
	}
	return { identity, submit, reset: () => setIdentity(null) };
}

function ForgotPasswordPage() {
	const { identity, submit, reset } = usePasswordReset();
	return (
		<AuthCard
			key={identity ? "reset" : "request"}
			title="비밀번호 재설정"
			description={
				identity
					? "등록된 번호로 받은 인증번호와 새 비밀번호를 입력하세요. 2단계 인증은 유지됩니다."
					: "가입 이메일에 등록된 번호로 인증 문자를 요청하세요. 가입된 계정이면 문자를 보냅니다."
			}
			fields={identity ? RESET_FIELDS : IDENTITY_FIELDS}
			submitLabel={identity ? "비밀번호 변경" : "인증 문자 받기"}
			onSubmit={submit}
			footer={
				<div className="flex flex-col gap-3 text-center text-sm">
					{identity && (
						<Button variant="link" type="button" onClick={reset}>
							입력 정보를 바꾸거나 문자 다시 받기
						</Button>
					)}
					<Link to="/admin/login">로그인으로 돌아가기</Link>
				</div>
			}
		/>
	);
}
