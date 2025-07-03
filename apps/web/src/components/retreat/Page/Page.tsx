"use client";
import { AnimatePresence, motion } from "framer-motion";
import React, { Suspense, useMemo } from "react";
import { Show } from "react-smart-conditional";
import { useStepAtomValue } from "~/atoms/stepAtom";
import { ConditionLazyRenderer } from "~/components/common/ConditionLazyRenderer";
import {
	BaseErrorFallback,
	ErrorBoundary,
} from "~/components/common/ErrorBoundary";
import { FormSkeleton } from "~/components/forms/FormSkeleton";
import { Welcome } from "~/components/retreat/Welcome";

const FormName = React.lazy(() =>
	import("~/components/retreat/FormName").then((module) => ({
		default: module.FormName,
	}))
);

const FormPhone = React.lazy(() =>
	import("~/components/retreat/FormPhone").then((module) => ({
		default: module.FormPhone,
	}))
);

const FormGender = React.lazy(() =>
	import("~/components/retreat/FormGender").then((module) => ({
		default: module.FormGender,
	}))
);

const FormDepartment = React.lazy(() =>
	import("~/components/retreat/FormDepartment").then((module) => ({
		default: module.FormDepartment,
	}))
);

const FormAgeGroup = React.lazy(() =>
	import("~/components/retreat/FormAgeGroup").then((module) => ({
		default: module.FormAgeGroup,
	}))
);

const FormTshirtSize = React.lazy(() =>
	import("~/components/retreat/FormTshirtSize").then((module) => ({
		default: module.FormTshirtSize,
	}))
);

const FormTFTeam = React.lazy(() =>
	import("~/components/retreat/FormTFTeam").then((module) => ({
		default: module.FormTFTeam,
	}))
);

const FormNumberOfStays = React.lazy(() =>
	import("~/components/retreat/FormNumberOfStays").then((module) => ({
		default: module.FormNumberOfStays,
	}))
);

const FormAttendanceTime = React.lazy(() =>
	import("~/components/retreat/FormAttendanceTime").then((module) => ({
		default: module.FormAttendanceTime,
	}))
);

const FormPickupDescription = React.lazy(() =>
	import("~/components/retreat/FormPickupDescription").then((module) => ({
		default: module.FormPickupDescription,
	}))
);

const FormCarSupport = React.lazy(() =>
	import("~/components/retreat/FormCarSupport").then((module) => ({
		default: module.FormCarSupport,
	}))
);

const FormCarSupportContent = React.lazy(() =>
	import("~/components/retreat/FormCarSupportContent").then((module) => ({
		default: module.FormCarSupportContent,
	}))
);

const FormPaid = React.lazy(() =>
	import("~/components/retreat/FormPaid").then((module) => ({
		default: module.FormPaid,
	}))
);

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
		key: "tshirtSize",
		name: "FormTshirtSize",
		component: FormTshirtSize,
	},
	{
		idx: 7,
		key: "tfTeam",
		name: "FormTFTeam",
		component: FormTFTeam,
	},
	{
		idx: 8,
		key: "numberOfStays",
		name: "FormNumberOfStays",
		component: FormNumberOfStays,
	},
	{
		idx: 9,
		key: "attendanceTime",
		name: "FormAttendanceTime",
		component: FormAttendanceTime,
	},
	{
		idx: 10,
		key: "pickup",
		name: "FormPickupDescription",
		component: FormPickupDescription,
	},
	{
		idx: 11,
		key: "carSupport",
		name: "FormCarSupport",
		component: FormCarSupport,
	},
	{
		idx: 12,
		key: "carSupportContent",
		name: "FormCarSupportContent",
		component: FormCarSupportContent,
	},
	{
		idx: 13,
		key: "paid",
		name: "FormPaid",
		component: FormPaid,
	},
] as const;

export const TOTAL_STEP_COUNT = 13;

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

	const isFirstStep = useMemo(() => step === 0, [step]);

	return (
		<AnimatePresence mode="wait">
			<motion.div
				key={step}
				initial={{ opacity: 1, x: 0 }}
				animate={{ opacity: 1, x: 0 }}
				exit={{ opacity: 0, y: 50 }}
				transition={{ duration: 0.5 }}
			>
				<Show>
					<Show.If condition={isFirstStep}>
						<Welcome.Anmation />
					</Show.If>
					<Show.If condition={isConfirm}>
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
					</Show.If>
					<Show.If condition={isCompleted}>
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
