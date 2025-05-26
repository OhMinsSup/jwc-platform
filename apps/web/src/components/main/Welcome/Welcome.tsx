import { Button, Icons, cn } from "@jwc/ui";
import React from "react";
import { useStepNavigation } from "~/libs/hooks/useStepNavigation";

export default function Welcome() {
	const { goToNextStep } = useStepNavigation();

	return (
		<div
			id="hooks-hero"
			className={cn(
				"relative h-[calc(100dvh-64px)] w-full",
				"flex grow flex-col items-center justify-center gap-8",
				"border-b "
			)}
		>
			<hgroup
				className={cn(
					"text-center",
					"z-10",
					"flex flex-col items-center justify-center gap-4",
					"px-4 lg:px-0"
				)}
			>
				<h2 className="scroll-m-20 font-semibold text-3xl tracking-tight first:mt-0">
					수련회 신청서
				</h2>
				{/* <p className={cn("max-w-[34ch]")}>
					Free and open-source hooks build with{" "}
					<span className={cn("font-bold")}>React</span> and{" "}
					<span className={cn("font-bold")}>Payload</span> and{" "}
					<span className={cn("font-bold")}>TypeScript</span>. Perfect for your
					next application. <span className={cn("font-bold")}>Shadcn</span>{" "}
					powered.
				</p> */}
			</hgroup>
			<div
				className={cn(
					"z-10 flex w-3/4 flex-col justify-center gap-4 lg:flex-row lg:items-center",
					"px-4 lg:px-0"
				)}
			>
				<Button type="button" onClick={goToNextStep}>
					시작하기
					<Icons.ChevronRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
				</Button>
			</div>
		</div>
	);
}
