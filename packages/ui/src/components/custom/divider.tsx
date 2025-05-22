import { cn } from "@jwc/ui/lib/utils";
import React from "react";

interface DividerProps {
	orientation: "vertical" | "horizontal";
	className?: string;
}

export function Divider({ orientation, className }: DividerProps) {
	return (
		// biome-ignore lint/a11y/useFocusableInteractive: <explanation>
		<div
			data-orientation={orientation}
			aria-orientation={orientation}
			role="separator"
			className={cn(className)}
		/>
	);
}
