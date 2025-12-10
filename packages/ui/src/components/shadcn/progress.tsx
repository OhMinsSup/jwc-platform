"use client";

import { cn } from "@jwc/ui/lib/utils";
import * as ProgressPrimitive from "@radix-ui/react-progress";

function Progress({
	className,
	value,
	...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
	return (
		<ProgressPrimitive.Root
			className={cn(
				"relative h-4 w-full overflow-hidden rounded-full bg-secondary",
				className
			)}
			data-slot="progress"
			{...props}
		>
			<ProgressPrimitive.Indicator
				className="h-full w-full flex-1 bg-primary transition-all"
				style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
			/>
		</ProgressPrimitive.Root>
	);
}

export { Progress };
