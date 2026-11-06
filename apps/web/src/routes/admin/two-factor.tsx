import { Button } from "@jwc/ui/components/button";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { ADMIN_AUTH_POLICY } from "../../features/admin-access/domain/admin-auth-policy";
import { ADMIN_TOTP_CODE_FIELD } from "../../features/admin-access/model/admin-auth";
import { authClient } from "../../platform/auth-client";
import { AuthCard } from "../../platform/ui/auth-card";
import type { AuthFieldDef } from "../../platform/ui/auth-card";

const RECOVERY_FIELD: AuthFieldDef = {
	name: "code",
	label: "복구 코드",
	type: "text",
	autoComplete: "off",
};

export const Route = createFileRoute("/admin/two-factor")({
	head: () => ({ meta: [{ title: "2단계 인증" }] }),
	component: TwoFactorPage,
});

function TwoFactorPage() {
	const [recovery, setRecovery] = useState(false);
	const navigate = useNavigate();
	return (
		<AuthCard
			key={recovery ? "recovery" : "totp"}
			title={recovery ? "복구 코드로 로그인" : "2단계 인증"}
			description={
				recovery
					? "보관한 복구 코드 하나를 입력하세요. 사용한 코드는 다시 쓸 수 없습니다."
					: `인증 앱에 표시된 ${ADMIN_AUTH_POLICY.totp.codeLength}자리 코드를 입력하세요.`
			}
			fields={[recovery ? RECOVERY_FIELD : ADMIN_TOTP_CODE_FIELD]}
			submitLabel="인증하고 로그인"
			footer={
				<div className="flex flex-col gap-3 text-center text-sm">
					<Button
						type="button"
						variant="link"
						onClick={() => setRecovery(!recovery)}
					>
						{recovery ? "인증 앱 사용하기" : "인증 앱을 사용할 수 없나요?"}
					</Button>
					<Link to="/admin/login">로그인부터 다시 하기</Link>
				</div>
			}
			onSubmit={async ({ code = "" }) => {
				const { error } = recovery
					? await authClient.twoFactor.verifyBackupCode({ code: code.trim() })
					: await authClient.twoFactor.verifyTotp({ code: code.trim() });
				if (error) {
					return "인증하지 못했습니다. 코드를 확인해주세요. 인증 시간이 지났다면 로그인부터 다시 해주세요";
				}
				await navigate({ to: "/admin" });
				return null;
			}}
		/>
	);
}
