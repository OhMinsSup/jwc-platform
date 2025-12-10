"use client";

import { cn } from "@jwc/ui";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { STEP_LABELS, type StepSlug } from "@/store/onboarding-form-store";

interface StepProgressProps {
	currentStep: StepSlug;
}

const FORM_STEPS: StepSlug[] = [
	"personal",
	"attendance",
	"support",
	"additional",
	"confirm",
];

function getIndicatorColor(isCompleted: boolean, isCurrent: boolean): string {
	if (isCompleted) {
		return "hsl(var(--primary))"; // 완료: 진한 primary
	}
	if (isCurrent) {
		return "hsl(var(--primary) / 0.7)"; // 현재: 중간 톤
	}
	return "hsl(var(--muted))"; // 미진행: 연한 muted
}

function getLabelClassName(isCurrent: boolean, isCompleted: boolean): string {
	if (isCompleted) {
		return "text-foreground font-semibold opacity-100"; // 완료: 진하게
	}
	if (isCurrent) {
		return "text-primary font-medium opacity-90"; // 현재: 강조색 + 중간
	}
	return "text-muted-foreground font-normal opacity-50"; // 미진행: 연하게
}

interface StepIndicatorProps {
	step: StepSlug;
	index: number;
	isCompleted: boolean;
	isCurrent: boolean;
	isLast: boolean;
}

function StepIndicator({
	step,
	index,
	isCompleted,
	isCurrent,
	isLast,
}: StepIndicatorProps) {
	return (
		<div className="flex flex-1 items-center" key={step}>
			<div className="flex flex-col items-center">
				<motion.div
					animate={{
						scale: isCurrent ? 1.1 : 1,
						backgroundColor: getIndicatorColor(isCompleted, isCurrent),
					}}
					className={cn(
						"relative flex h-8 w-8 items-center justify-center rounded-full font-medium text-xs",
						isCompleted
							? "text-primary-foreground" // 완료: 진한 배경 + 밝은 글자
							: // biome-ignore lint/style/noNestedTernary: <explanation> It's more readable this way.</explanation>
								isCurrent
								? "text-primary-foreground" // 현재: 중간 배경 + 밝은 글자
								: "text-muted-foreground/60" // 미진행: 연한 배경 + 연한 글자
					)}
					initial={false}
					transition={{ duration: 0.2 }}
				>
					{isCompleted ? (
						<motion.div
							animate={{ scale: 1 }}
							initial={{ scale: 0 }}
							transition={{ type: "spring", stiffness: 300, damping: 20 }}
						>
							<Check
								className={cn(
									"h-4 w-4",
									getLabelClassName(isCurrent, isCompleted)
								)}
							/>
						</motion.div>
					) : (
						<span className={cn(getLabelClassName(isCurrent, isCompleted))}>
							{index + 1}
						</span>
					)}
				</motion.div>
				<span
					className={cn(
						"mt-1.5 whitespace-nowrap font-medium text-[10px]",
						getLabelClassName(isCurrent, isCompleted)
					)}
				>
					{STEP_LABELS[step]}
				</span>
			</div>

			{!isLast && (
				<div className="mx-2 flex-1">
					<div className="h-0.5 overflow-hidden rounded-full bg-muted">
						<motion.div
							animate={{
								width: isCompleted ? "100%" : "0%",
							}}
							className="h-full bg-primary"
							initial={false}
							transition={{ duration: 0.3, ease: "easeInOut" }}
						/>
					</div>
				</div>
			)}
		</div>
	);
}

export function StepProgress({ currentStep }: StepProgressProps) {
	const currentIndex = FORM_STEPS.indexOf(currentStep);

	return (
		<div className="flex items-center justify-between gap-2">
			{FORM_STEPS.map((step, index) => (
				<StepIndicator
					index={index}
					isCompleted={index < currentIndex}
					isCurrent={index === currentIndex}
					isLast={index === FORM_STEPS.length - 1}
					key={step}
					step={step}
				/>
			))}
		</div>
	);
}

export default StepProgress;
