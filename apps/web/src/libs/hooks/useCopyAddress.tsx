import React, { useCallback, useTransition } from "react";
import { toast } from "sonner";
import { env } from "~/env";
import { useCopyToClipboard } from "./useCopyToClipboard";

export function useCopyAccountNumber() {
	const [isPending, startTransition] = useTransition();

	const { copy, copiedText } = useCopyToClipboard({
		onSuccess: () => {
			toast(
				<p className="leading-7 [&:not(:first-child)]:mt-6">
					✅ 회비 납입 계좌번호가 복사되었습니다.
				</p>
			);
		},
	});

	const onCopy = useCallback(() => {
		startTransition(async () => {
			await copy(env.NEXT_PUBLIC_PAID_ACCOUNT_NUMBER);
		});
	}, [copy]);

	return {
		isPending,
		copiedText,
		onCopy,
	};
}
