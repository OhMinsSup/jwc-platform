"use client";
import type React from "react";
import { type FieldValues, useFormContext } from "react-hook-form";
import { ButtonSubmitAction } from "~/components/common/ButtonSubmitAction";
import type { LazyComponentProps } from "~/components/common/ConditionLazyRenderer/ConditionLazyRenderer";
import { useStepNavigation } from "~/libs/hooks/useStepNavigation";

export interface FormContainerProps<TFieldValues extends FieldValues>
	extends Pick<LazyComponentProps, "idx"> {
	isLoading?: boolean;
	children: React.ReactNode;
	onSubmitAction: (data: TFieldValues) => void;
}

export default function FormContainer<TFieldValues extends FieldValues>({
	idx,
	isLoading,
	children,
	onSubmitAction,
}: FormContainerProps<TFieldValues>) {
	const { handleSubmit } = useFormContext<TFieldValues>();
	const { goToPreviousStep } = useStepNavigation();

	return (
		<form
			className="flex flex-col space-y-4"
			onSubmit={handleSubmit(onSubmitAction)}
		>
			{children}
			<ButtonSubmitAction
				isLoading={isLoading}
				idx={idx}
				onPreviousNavigation={goToPreviousStep}
			/>
		</form>
	);
}
