import { Button, Icons } from "@jwc/ui";
import React from "react";

interface ButtonSubmitActionProps {
	isLoading?: boolean;
	idx: number;
	onPreviousNavigation?: () => void;
}

export default function ButtonSubmitAction({
	isLoading,
	idx,
	onPreviousNavigation,
}: ButtonSubmitActionProps) {
	return (
		<div className="flex flex-row items-center justify-start space-x-4">
			<Button size="sm" type="submit">
				{isLoading ? <Icons.Loader2 className="animate-spin" /> : null}
				<span>확인</span>
			</Button>
			<p className="flex flex-row items-center space-x-1 text-muted-foreground text-sm opacity-70">
				<span>Press </span>
				<kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium font-mono text-[10px] text-muted-foreground opacity-100">
					<span className="text-xs">Enter</span>
				</kbd>
				<Icons.CornerDownLeft className="size-4" />
			</p>
			{idx <= 1 ? null : (
				<div className="flex w-full items-center justify-end">
					<Button
						size="sm"
						type="button"
						variant="secondary"
						onClick={onPreviousNavigation}
					>
						<span>뒤로가기</span>
					</Button>
				</div>
			)}
		</div>
	);
}
