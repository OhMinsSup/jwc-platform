import { Callout } from "@jwc/ui-patterns/components/callout";
import { useNavigate } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { z } from "zod";

import { authClient } from "../../../platform/auth-client";
import { AuthCard } from "../../../platform/ui/auth-card";
import { ADMIN_AUTH_POLICY } from "../domain/admin-auth-policy";
import { ADMIN_TOTP_CODE_FIELD } from "../model/admin-auth";

const SetupSchema = z.object({
	totpURI: z.string().startsWith("otpauth://totp/"),
	backupCodes: z.array(z.string()).min(1),
});
type SetupState =
	| { step: "password" }
	| { step: "verify"; uri: string; backupCodes: string[] }
	| { step: "backup"; backupCodes: string[] };

const PASSWORD_FIELDS = [
	{
		name: "password",
		label: "비밀번호",
		type: "password",
		autoComplete: "current-password",
	},
] satisfies Parameters<typeof AuthCard>[0]["fields"];
const CODE_FIELDS = [ADMIN_TOTP_CODE_FIELD] satisfies Parameters<
	typeof AuthCard
>[0]["fields"];

export function TwoFactorSetup() {
	const { state, onSubmit } = useSetup();
	if (state.step === "backup") {
		return <BackupCodes codes={state.backupCodes} />;
	}
	return (
		<AuthCard
			key={state.step}
			title="2단계 인증 등록"
			description={
				state.step === "password"
					? "관리자 기능을 사용하려면 인증 앱을 등록해야 합니다. 비밀번호를 다시 입력해주세요."
					: `인증 앱에서 QR 코드를 스캔하고 표시되는 ${ADMIN_AUTH_POLICY.totp.codeLength}자리 코드를 입력하세요.`
			}
			fields={state.step === "password" ? PASSWORD_FIELDS : CODE_FIELDS}
			submitLabel={
				state.step === "password" ? "인증 앱 등록 시작" : "등록 완료"
			}
			onSubmit={onSubmit}
		>
			{state.step === "verify" && <AuthenticatorQr uri={state.uri} />}
		</AuthCard>
	);
}

function useSetup() {
	const [state, setState] = useState<SetupState>({ step: "password" });
	async function onSubmit({
		password = "",
		code = "",
	}: Record<string, string>) {
		if (state.step === "password") {
			const { data, error } = await authClient.twoFactor.enable({ password });
			if (error) {
				return "등록을 시작하지 못했습니다. 비밀번호를 확인해주세요";
			}
			const parsed = SetupSchema.safeParse(data);
			if (!parsed.success) {
				return "등록 정보를 불러오지 못했습니다. 다시 시도해주세요";
			}
			setState({
				step: "verify",
				uri: parsed.data.totpURI,
				backupCodes: parsed.data.backupCodes,
			});
			return null;
		}
		if (state.step !== "verify") {
			return null;
		}
		const { error } = await authClient.twoFactor.verifyTotp({
			code: code.trim(),
		});
		if (error) {
			return "코드가 올바르지 않습니다. 인증 앱의 현재 코드를 입력해주세요";
		}
		setState({ step: "backup", backupCodes: state.backupCodes });
		return null;
	}
	return { state, onSubmit };
}

function BackupCodes({ codes }: { codes: string[] }) {
	const navigate = useNavigate();
	return (
		<AuthCard
			title="복구 코드를 보관하세요"
			description="인증 앱을 잃어버리면 이 코드로 로그인할 수 있습니다. 각 코드는 한 번만 사용할 수 있습니다."
			fields={[]}
			submitLabel="코드를 보관했습니다"
			onSubmit={async () => {
				await navigate({ to: "/admin" });
				return null;
			}}
		>
			<Callout tone="warning">
				복구 코드를 비밀번호 관리자 등 안전한 곳에 보관하세요. 이 화면을 닫으면
				다시 표시하지 않습니다.
			</Callout>
			<ul
				className="grid grid-cols-2 gap-2 font-mono text-sm"
				aria-label="복구 코드"
			>
				{codes.map((code) => (
					<li key={code}>{code}</li>
				))}
			</ul>
		</AuthCard>
	);
}

function AuthenticatorQr({ uri }: { uri: string }) {
	const secret = new URL(uri).searchParams.get("secret");
	return (
		<div className="flex flex-col items-center gap-4">
			<QRCodeSVG
				value={uri}
				size={192}
				bgColor="#ffffff"
				fgColor="#000000"
				marginSize={4}
				title="인증 앱 등록용 QR 코드"
			/>
			<details className="w-full text-sm">
				<summary className="cursor-pointer">
					QR 코드를 스캔할 수 없나요?
				</summary>
				<p className="mt-2">인증 앱에 아래 설정 키를 직접 입력하세요.</p>
				<code className="mt-2 block break-all" data-testid="totp-setup-key">
					{secret}
				</code>
			</details>
		</div>
	);
}
