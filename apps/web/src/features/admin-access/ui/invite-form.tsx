import { formText } from "@jwc/common/form-data";
import { CopyButton } from "@jwc/ui-patterns/components/copy-button";
import { Button } from "@jwc/ui/components/button";
import { Input } from "@jwc/ui/components/input";
import { Label } from "@jwc/ui/components/label";
import { useRouter } from "@tanstack/react-router";
import { KeyRound, Loader2, UserPlus } from "lucide-react";
import { useState } from "react";
import type { SubmitEvent } from "react";

import { DateTimeText } from "../../../platform/ui/date-time-text";
import { createInviteFn } from "../functions";

/** RFC 5321 주소 길이 상한 (서버 검증과 같은 값) */
const MAX_EMAIL_LENGTH = 254;

interface IssuedInvite {
	code: string;
	email: string;
	expiresAt: number;
}

/** 발급 → 코드 한 번 표시 → 목록 다시 읽기. 실패 메시지는 값으로 받는다 */
function useCreateInvite() {
	const router = useRouter();
	const [issued, setIssued] = useState<IssuedInvite | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);
	const submit = async (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		const form = event.currentTarget;
		setPending(true);
		const result = await createInviteFn({
			data: { email: formText(new FormData(form), "email") },
		});
		setPending(false);
		if (!result.ok) {
			setError(result.message);
			return;
		}
		setError(null);
		setIssued(result.data);
		form.reset();
		await router.invalidate();
	};
	return { issued, error, pending, submit };
}

/** 새 코드는 이 화면을 떠나면 다시 볼 수 없다 (서버는 해시만 저장) */
function IssuedCode({ invite }: { invite: IssuedInvite }) {
	return (
		<div className="bg-muted mt-4 space-y-2 rounded-xl p-4">
			<p className="flex items-center gap-2 text-sm font-medium">
				<KeyRound aria-hidden className="text-foreground h-4 w-4" />
				{invite.email} 초대 코드
			</p>
			<div className="bg-background flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
				<code className="font-mono text-sm break-all">{invite.code}</code>
				<CopyButton label="초대 코드 복사" text={invite.code} />
			</div>
			<p className="text-muted-foreground text-xs">
				<DateTimeText value={invite.expiresAt} />
				까지 한 번만 쓸 수 있습니다. 이 코드는 지금만 보이니 복사해서
				전달하세요.
			</p>
		</div>
	);
}

export function InviteForm() {
	const { issued, error, pending, submit } = useCreateInvite();
	return (
		<div className="bg-card rounded-xl border p-5">
			<form className="space-y-3" onSubmit={submit}>
				<div className="space-y-1.5">
					<Label htmlFor="invite-email">초대할 이메일</Label>
					<div className="flex flex-wrap gap-2">
						<Input
							aria-describedby="invite-email-hint"
							autoComplete="off"
							className="min-w-56 flex-1"
							id="invite-email"
							maxLength={MAX_EMAIL_LENGTH}
							name="email"
							required
							type="email"
						/>
						<Button disabled={pending} type="submit">
							{pending ? (
								<Loader2 aria-hidden className="h-4 w-4 animate-spin" />
							) : (
								<UserPlus aria-hidden className="h-4 w-4" />
							)}
							초대 코드 만들기
						</Button>
					</div>
					<p className="text-muted-foreground text-xs" id="invite-email-hint">
						ADMIN_EMAILS와 ADMIN_PHONES에 이메일·인증 번호가 등록된 관리자만
						초대할 수 있습니다.
					</p>
				</div>
				{error && (
					<p className="text-destructive text-sm" role="alert">
						{error}
					</p>
				)}
			</form>
			<div aria-live="polite">{issued && <IssuedCode invite={issued} />}</div>
		</div>
	);
}
