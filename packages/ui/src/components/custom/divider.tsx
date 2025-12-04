import { cn } from "@jwc/ui/lib/utils";

interface DividerProps {
	orientation: "horizontal" | "vertical";
	className?: string;
}

export function Divider({ orientation, className }: DividerProps) {
	return (
		<hr
			aria-orientation={orientation}
			className={cn(className)}
			data-orientation={orientation}
			data-slot="divider"
		/>
	);
}
