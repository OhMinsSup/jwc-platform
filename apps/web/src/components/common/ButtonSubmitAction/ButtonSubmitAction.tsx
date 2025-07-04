import { Button, Icons } from "@jwc/ui";
import React, { memo } from "react";

interface ButtonSubmitActionProps {
	isLoading?: boolean;
	idx: number;
	onPreviousNavigation?: () => void;
}

// 상수 분리
const KEYBOARD_HINT_CONFIG = {
	text: "Press",
	key: "Enter",
	className:
		"pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium font-mono text-[10px] text-muted-foreground opacity-100",
} as const;

const LOADING_ICON_CONFIG = {
	className: "animate-spin",
} as const;

const BUTTON_STYLES = {
	submit: "flex flex-row items-center justify-start space-x-4",
	hint: "flex flex-row items-center space-x-1 text-muted-foreground text-sm opacity-70",
	back: "flex w-full items-center justify-end",
} as const;

function ButtonSubmitAction({
	isLoading = false,
	idx,
	onPreviousNavigation,
}: ButtonSubmitActionProps) {
	const showBackButton = idx > 1;

	return (
		<div className={BUTTON_STYLES.submit}>
			<Button size="sm" type="submit" disabled={isLoading}>
				{isLoading && <Icons.Loader2 {...LOADING_ICON_CONFIG} />}
				<span>확인</span>
			</Button>

			<KeyboardHint />

			{showBackButton && (
				<BackButton onPreviousNavigation={onPreviousNavigation} />
			)}
		</div>
	);
}

// 키보드 힌트 컴포넌트 분리
const KeyboardHint = memo(() => (
	<p className={BUTTON_STYLES.hint}>
		<span>{KEYBOARD_HINT_CONFIG.text} </span>
		<kbd className={KEYBOARD_HINT_CONFIG.className}>
			<span className="text-xs">{KEYBOARD_HINT_CONFIG.key}</span>
		</kbd>
		<Icons.CornerDownLeft className="size-4" />
	</p>
));

KeyboardHint.displayName = "KeyboardHint";

// 뒤로가기 버튼 컴포넌트 분리
const BackButton = memo<{ onPreviousNavigation?: () => void }>(
	({ onPreviousNavigation }) => (
		<div className={BUTTON_STYLES.back}>
			<Button
				size="sm"
				type="button"
				variant="secondary"
				onClick={onPreviousNavigation}
			>
				<span>뒤로가기</span>
			</Button>
		</div>
	)
);

BackButton.displayName = "BackButton";

export default memo(ButtonSubmitAction);
