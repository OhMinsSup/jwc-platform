"use client";
import { AnimatePresence, motion } from "framer-motion";
import React, { Suspense, useMemo, useCallback } from "react";
import { Show } from "react-smart-conditional";
import { useStepAtomValue } from "~/atoms/stepAtom";
import { ConditionLazyRenderer } from "~/components/common/ConditionLazyRenderer";
import {
	BaseErrorFallback,
	ErrorBoundary,
} from "~/components/common/ErrorBoundary";
import { FormSkeleton } from "~/components/forms/FormSkeleton";
import { Welcome } from "~/components/retreat/Welcome";
import { STEP_COMPONENTS, STEP_CONFIG, componentMap } from "./StepComponents";

// Animation variants
const pageVariants = {
	initial: { opacity: 1, x: 0 },
	animate: { opacity: 1, x: 0 },
	exit: { opacity: 0, y: 50 },
} as const;

const pageTransition = {
	duration: 0.5,
} as const;

// Lazy load special components
const FormConfirm = React.lazy(() =>
	import("~/components/retreat/FormConfirm").then((module) => ({
		default: module.FormConfirm,
	}))
);

const Completed = React.lazy(() =>
	import("~/components/retreat/Completed").then((module) => ({
		default: module.Completed,
	}))
);

// Error boundary wrapper component for reusability
const FormErrorBoundary: React.FC<{
	children: React.ReactNode;
	stepKey: string;
	stepIdx: number;
}> = ({ children, stepKey, stepIdx }) => (
	<ErrorBoundary
		fallback={BaseErrorFallback}
		beforeCapture={(scope) => {
			scope.setTag("conditionLazyRendererKey", stepKey);
			scope.setTag("conditionLazyRendererIdx", stepIdx);
		}}
	>
		<Suspense fallback={<FormSkeleton />}>{children}</Suspense>
	</ErrorBoundary>
);

export default function Page() {
	const { step } = useStepAtomValue();

	// Memoize step conditions calculation
	const conditions = useMemo(
		() =>
			STEP_COMPONENTS.reduce(
				(acc, { key, idx }) => {
					acc[key] = step === idx;
					return acc;
				},
				{} as Record<string, boolean>
			),
		[step]
	);

	// Memoize step state checks
	const stepState = useMemo(
		() => ({
			isConfirm: step === STEP_CONFIG.CONFIRM_STEP,
			isCompleted: step === STEP_CONFIG.COMPLETED_STEP,
			isWelcome: step === 0,
		}),
		[step]
	);

	// Memoize motion div props (key 제외)
	const motionProps = useMemo(
		() => ({
			variants: pageVariants,
			initial: "initial",
			animate: "animate",
			exit: "exit",
			transition: pageTransition,
		}),
		[]
	);

	const renderConfirmStep = useCallback(
		() => (
			<FormErrorBoundary stepKey="confirm" stepIdx={STEP_CONFIG.CONFIRM_STEP}>
				<FormConfirm />
			</FormErrorBoundary>
		),
		[]
	);

	const renderCompletedStep = useCallback(
		() => (
			<FormErrorBoundary
				stepKey="completed"
				stepIdx={STEP_CONFIG.COMPLETED_STEP}
			>
				<Completed />
			</FormErrorBoundary>
		),
		[]
	);

	return (
		<AnimatePresence mode="wait">
			<motion.div key={step} {...motionProps}>
				<Show>
					<Show.If condition={stepState.isWelcome}>
						<Welcome.Anmation />
					</Show.If>
					<Show.If condition={stepState.isConfirm}>
						{renderConfirmStep()}
					</Show.If>
					<Show.If condition={stepState.isCompleted}>
						{renderCompletedStep()}
					</Show.If>
					<Show.Else>
						<ConditionLazyRenderer
							conditions={conditions}
							componentMap={componentMap}
						/>
					</Show.Else>
				</Show>
			</motion.div>
		</AnimatePresence>
	);
}

// Export for backward compatibility
export { STEP_CONFIG, STEP_COMPONENTS };
