import { formText } from "@jwc/common/form-data";
import { Callout } from "@jwc/ui-patterns/components/callout";
import { Button } from "@jwc/ui/components/button";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import {
	requestAdminSmsFn,
	verifyAdminPhoneFn,
} from "../../features/admin-access/functions-phone";
import {
	ADMIN_SMS_CODE_FIELD,
	ADMIN_SMS_SENT_MESSAGE,
} from "../../features/admin-access/model/admin-auth";
import { AuthCard } from "../../platform/ui/auth-card";
import type { AuthFieldDef } from "../../platform/ui/auth-card";

const FIELDS: AuthFieldDef[] = [
	{ name: "email", label: "가입 이메일", type: "email", autoComplete: "email" },
	{
		name: "phoneNumber",
		label: "휴대전화 번호",
		type: "tel",
		autoComplete: "tel",
		maxLength: 32,
	},
	ADMIN_SMS_CODE_FIELD,
];

export const Route = createFileRoute("/admin/verify-phone")({
	component: VerifyPhonePage,
});

function VerifyPhonePage() {
	const [notice, setNotice] = useState<string | null>(null);
	const navigate = useNavigate();
	return (
		<AuthCard
			title="휴대전화 인증"
			description="기존 계정은 등록된 휴대전화 인증이 필요합니다. 로그인한 계정의 이메일과 번호를 입력하세요."
			fields={FIELDS}
			submitLabel="인증 완료"
			onSubmit={async ({ phoneNumber = "", code = "" }) => {
				const result = await verifyAdminPhoneFn({
					data: { phoneNumber, code },
				});
				if (!result.ok) {
					return result.message;
				}
				await navigate({ to: "/admin/login" });
				return null;
			}}
			footer={
				<div className="flex flex-col gap-3 text-sm">
					<RequestSmsButton onNotice={setNotice} />
					<Link className="text-center" to="/admin/login">
						로그인으로 돌아가기
					</Link>
				</div>
			}
		>
			{notice && (
				<output>
					<Callout>{notice}</Callout>
				</output>
			)}
		</AuthCard>
	);
}

async function requestSms(form: HTMLFormElement): Promise<string> {
	const fields = new FormData(form);
	const email = formText(fields, "email");
	const phoneNumber = formText(fields, "phoneNumber");
	if (!(email && phoneNumber)) {
		return "먼저 가입 이메일과 휴대전화 번호를 입력해주세요";
	}
	try {
		const result = await requestAdminSmsFn({ data: { email, phoneNumber } });
		return result.ok ? ADMIN_SMS_SENT_MESSAGE : result.message;
	} catch (error) {
		if (!(error instanceof Error)) {
			throw error;
		}
		return "문자를 요청하지 못했습니다. 입력 정보와 연결을 확인하고 다시 시도해주세요";
	}
}

function RequestSmsButton({
	onNotice,
}: {
	onNotice: (message: string) => void;
}) {
	const [sending, setSending] = useState(false);
	return (
		<Button
			type="button"
			variant="outline"
			disabled={sending}
			onClick={async (event) => {
				const form = event.currentTarget.closest("form");
				if (!form) {
					return;
				}
				setSending(true);
				onNotice(await requestSms(form));
				setSending(false);
			}}
		>
			인증 문자 받기
		</Button>
	);
}
