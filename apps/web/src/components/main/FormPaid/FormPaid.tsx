"use client";
import {
	Button,
	Icons,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@jwc/ui";
import type React from "react";
import { useCallback, useTransition } from "react";
import { toast } from "sonner";
import type { LazyComponentProps } from "~/components/common/ConditionLazyRenderer/ConditionLazyRenderer";
import { FormPaidContext } from "~/components/forms/FormContext";
import type { FormFieldSchema } from "~/components/forms/FormContext/FormPaidContext";
import { SwitchFieldForm } from "~/components/forms/SwitchFieldForm";
import { env } from "~/env";
import { useCopyToClipboard } from "~/libs/hooks/useCopyToClipboard";
import { useStepSubmitAction } from "~/libs/hooks/useStepSubmitAction";

function InfoPopover() {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="ghost" size="icon">
					<Icons.Info className="h-4 w-4" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80">
				<div className="mt-3 grid gap-3">
					<div className="font-semibold">회비</div>
					<dl className="grid gap-3">
						<div className="flex items-center justify-between">
							<dt className="text-muted-foreground">전체참여(3박4일)</dt>
							<dd>6만원</dd>
						</div>
						<div className="flex items-center justify-between">
							<dt className="text-muted-foreground">부분참석(2박3일)</dt>
							<dd>5만원</dd>
						</div>
						<div className="flex items-center justify-between">
							<dt className="text-muted-foreground">부분참석(1박2일)</dt>
							<dd>4만원</dd>
						</div>
					</dl>
				</div>
			</PopoverContent>
		</Popover>
	);
}

function CopyButton() {
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

	return (
		<Button
			type="button"
			variant="ghost"
			size="icon"
			disabled={isPending}
			onClick={onCopy}
		>
			{isPending ? (
				<Icons.Loader2 className="h-4 w-4 animate-spin" />
			) : (
				<>
					{copiedText ? (
						<Icons.CopyCheck className="h-4 w-4" />
					) : (
						<Icons.Copy className="h-4 w-4" />
					)}
				</>
			)}
		</Button>
	);
}

export default function FormPaid({ idx }: LazyComponentProps) {
	const { onSubmitAction, isLoading } = useStepSubmitAction<FormFieldSchema>();

	return (
		<FormPaidContext>
			<SwitchFieldForm<FormFieldSchema>
				idx={idx}
				isLoading={isLoading}
				name="isPaid"
				label="회비를 납부하셨나요? 납부 하셨다면 체크해주세요."
				afterLabel={
					<div className="flex flex-row gap-2">
						<InfoPopover />
						<CopyButton />
					</div>
				}
				description={
					<>
						회비를 납부한 경우 체크를 해주세요.
						<br />
						회비 납부을 원하시면 <strong>위에 있는 복사 버튼</strong>을
						눌러주세요.
					</>
				}
				onSubmitAction={onSubmitAction}
			/>
		</FormPaidContext>
	);
}
