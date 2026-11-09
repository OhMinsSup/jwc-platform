import { Button } from "@jwc/ui/components/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { AuthCard } from "../../../platform/ui/auth-card";
import type { AuthFieldDef } from "../../../platform/ui/auth-card";
import { ADMIN_AUTH_POLICY } from "../domain/admin-auth-policy";
import type { SignupInput } from "../domain/admin-input";
import { signUpAdminFn } from "../functions";
import { requestAdminSmsFn } from "../functions-phone";
import {
	ADMIN_SMS_CODE_FIELD,
	ADMIN_SMS_VALIDITY_TEXT,
} from "../model/admin-auth";

type SignupDraft = Omit<SignupInput, "code">;
const SIGNUP_FIELDS: AuthFieldDef[] = [
	{
		name: "name",
		label: "이름",
		type: "text",
		autoComplete: "name",
		maxLength: 50,
	},
	{ name: "email", label: "이메일", type: "email", autoComplete: "email" },
	{
		name: "password",
		label: "비밀번호",
		type: "password",
		autoComplete: "new-password",
		minLength: ADMIN_AUTH_POLICY.password.minLength,
		maxLength: ADMIN_AUTH_POLICY.password.maxLength,
		hint: `${ADMIN_AUTH_POLICY.password.minLength}자 이상`,
	},
	{
		name: "phoneNumber",
		label: "휴대전화 번호",
		type: "tel",
		autoComplete: "tel",
		maxLength: 32,
		hint: "운영자가 관리자 이메일에 등록한 번호를 입력하세요",
	},
	{
		name: "inviteCode",
		label: "초대 코드",
		type: "text",
		autoComplete: "off",
		optional: true,
		hint: "계정이 하나도 없으면 초대 코드 없이 첫 가입을 할 수 있습니다",
	},
];
const CODE_FIELDS: AuthFieldDef[] = [ADMIN_SMS_CODE_FIELD];

function useSignupFlow() {
	const [draft, setDraft] = useState<SignupDraft | null>(null);
	const navigate = useNavigate();
	async function submit(values: Record<string, string>) {
		if (!draft) {
			const input = {
				name: values.name ?? "",
				email: values.email ?? "",
				password: values.password ?? "",
				phoneNumber: values.phoneNumber ?? "",
				inviteCode: values.inviteCode ?? "",
			};
			const result = await requestAdminSmsFn({
				data: { email: input.email, phoneNumber: input.phoneNumber },
			});
			if (!result.ok) {
				return result.message;
			}
			setDraft(input);
			return null;
		}
		const result = await signUpAdminFn({
			data: { ...draft, code: values.code ?? "" },
		});
		if (!result.ok) {
			return result.message;
		}
		await navigate({ to: "/admin/login" });
		return null;
	}
	return { draft, submit, reset: () => setDraft(null) };
}

export function SignupFlow() {
	const { draft, submit, reset } = useSignupFlow();
	return (
		<AuthCard
			key={draft ? "sms" : "signup"}
			title={draft ? "휴대전화 인증" : "관리자 가입"}
			description={
				draft
					? `등록된 번호로 보낸 ${ADMIN_AUTH_POLICY.sms.codeLength}자리 인증번호를 ${ADMIN_SMS_VALIDITY_TEXT} 안에 입력하세요. 인증 후 계정이 만들어집니다.`
					: "이메일·비밀번호와 등록된 휴대전화로 가입합니다. 첫 관리자는 초대 코드가 필요하지 않습니다."
			}
			fields={draft ? CODE_FIELDS : SIGNUP_FIELDS}
			submitLabel={draft ? "인증하고 가입하기" : "인증 문자 받기"}
			onSubmit={submit}
			footer={
				<div className="flex flex-col gap-3 text-center text-sm">
					{draft && (
						<Button type="button" variant="link" onClick={reset}>
							입력 정보를 바꾸거나 문자 다시 받기
						</Button>
					)}
					<Link to="/admin/login">이미 계정이 있다면 로그인</Link>
				</div>
			}
		/>
	);
}
