"use client";
import { AnimatePresence, motion } from "framer-motion";
import React, { Suspense, useMemo } from "react";
import { useStepAtomValue } from "~/atoms/stepAtom";
import { ConditionLazyRenderer } from "~/components/common/ConditionLazyRenderer";
import {
	BaseErrorFallback,
	ErrorBoundary,
} from "~/components/common/ErrorBoundary";
import { FormSkeleton } from "~/components/forms/FormSkeleton";

const FormName = React.lazy(() =>
	import("~/components/main/FormName").then((module) => ({
		default: module.FormName,
	}))
);

const FormPhone = React.lazy(() =>
	import("~/components/main/FormPhone").then((module) => ({
		default: module.FormPhone,
	}))
);

const FormGender = React.lazy(() =>
	import("~/components/main/FormGender").then((module) => ({
		default: module.FormGender,
	}))
);

const FormDepartment = React.lazy(() =>
	import("~/components/main/FormDepartment").then((module) => ({
		default: module.FormDepartment,
	}))
);

const FormAgeGroup = React.lazy(() =>
	import("~/components/main/FormAgeGroup").then((module) => ({
		default: module.FormAgeGroup,
	}))
);

const FormTFTeam = React.lazy(() =>
	import("~/components/main/FormTFTeam").then((module) => ({
		default: module.FormTFTeam,
	}))
);

const FormNumberOfStays = React.lazy(() =>
	import("~/components/main/FormNumberOfStays").then((module) => ({
		default: module.FormNumberOfStays,
	}))
);

const FormPickupDescription = React.lazy(() =>
	import("~/components/main/FormPickupDescription").then((module) => ({
		default: module.FormPickupDescription,
	}))
);

const FormCarSupport = React.lazy(() =>
	import("~/components/main/FormCarSupport").then((module) => ({
		default: module.FormCarSupport,
	}))
);

const FormCarSupportContent = React.lazy(() =>
	import("~/components/main/FormCarSupportContent").then((module) => ({
		default: module.FormCarSupportContent,
	}))
);

const FormPaid = React.lazy(() =>
	import("~/components/main/FormPaid").then((module) => ({
		default: module.FormPaid,
	}))
);

const FormConfirm = React.lazy(() =>
	import("~/components/main/FormConfirm").then((module) => ({
		default: module.FormConfirm,
	}))
);

const Completed = React.lazy(() =>
	import("~/components/main/Completed").then((module) => ({
		default: module.Completed,
	}))
);

export const STEP_COMPONENTS = [
	{
		idx: 1,
		key: "name",
		name: "FormName",
		component: FormName,
	},
	{
		idx: 2,
		key: "phone",
		name: "FormPhone",
		component: FormPhone,
	},
	{
		idx: 3,
		key: "gender",
		name: "FormGender",
		component: FormGender,
	},
	{
		idx: 4,
		key: "department",
		name: "FormDepartment",
		component: FormDepartment,
	},
	{
		idx: 5,
		key: "ageGroup",
		name: "FormAgeGroup",
		component: FormAgeGroup,
	},
	{
		idx: 6,
		key: "tfTeam",
		name: "FormTFTeam",
		component: FormTFTeam,
	},
	{
		idx: 7,
		key: "numberOfStays",
		name: "FormNumberOfStays",
		component: FormNumberOfStays,
	},
	{
		idx: 8,
		key: "pickup",
		name: "FormPickupDescription",
		component: FormPickupDescription,
	},
	{
		idx: 9,
		key: "carSupport",
		name: "FormCarSupport",
		component: FormCarSupport,
	},
	{
		idx: 10,
		key: "carSupportContent",
		name: "FormCarSupportContent",
		component: FormCarSupportContent,
	},
	{
		idx: 11,
		key: "paid",
		name: "FormPaid",
		component: FormPaid,
	},
] as const;

export const TOTAL_STEP_COUNT = 11;

const CONFIRM_STEP = TOTAL_STEP_COUNT + 1;
const COMPLETED_STEP = TOTAL_STEP_COUNT + 2;

const componentMap = Object.fromEntries(
	STEP_COMPONENTS.map(({ key, component }) => [key, component])
);

export default function Page() {
	const { step } = useStepAtomValue();

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

	const isConfirm = useMemo(() => step === CONFIRM_STEP, [step]);

	const isCompleted = useMemo(() => step === COMPLETED_STEP, [step]);

	return (
		<AnimatePresence mode="wait">
			<motion.div
				key={step}
				initial={{ opacity: 1, x: 0 }}
				animate={{ opacity: 1, x: 0 }}
				exit={{ opacity: 0, y: 50 }}
				transition={{ duration: 0.5 }}
			>
				{!isConfirm && !isCompleted && (
					<ConditionLazyRenderer
						conditions={conditions}
						componentMap={componentMap}
					/>
				)}
				{isConfirm && (
					<ErrorBoundary
						fallback={BaseErrorFallback}
						beforeCapture={(scope) => {
							scope.setTag("conditionLazyRendererKey", "confirm");
							scope.setTag("conditionLazyRendererIdx", CONFIRM_STEP);
						}}
					>
						<Suspense fallback={<FormSkeleton />}>
							<FormConfirm />
						</Suspense>
					</ErrorBoundary>
				)}
				{isCompleted && (
					<ErrorBoundary
						fallback={BaseErrorFallback}
						beforeCapture={(scope) => {
							scope.setTag("conditionLazyRendererKey", "completed");
							scope.setTag("conditionLazyRendererIdx", COMPLETED_STEP);
						}}
					>
						<Suspense fallback={<FormSkeleton />}>
							<Completed />
						</Suspense>
					</ErrorBoundary>
				)}
			</motion.div>
		</AnimatePresence>
	);
}
