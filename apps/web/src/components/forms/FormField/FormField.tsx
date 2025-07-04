"use client";
import type React from "react";
import type { FieldValues } from "react-hook-form";
import { FormContainer } from "~/components/forms/FormContainer";
import type { FormContainerProps } from "~/components/forms/FormContainer/FormContainer";

export interface FormFieldProps<TFieldValues extends FieldValues>
	extends Omit<FormContainerProps<TFieldValues>, "children"> {
	children: React.ReactNode;
	footer?: React.ReactNode;
}

export default function FormField<TFieldValues extends FieldValues>({
	idx,
	children,
	onSubmitAction,
	isLoading,
	footer,
}: FormFieldProps<TFieldValues>) {
	return (
		<FormContainer<TFieldValues>
			idx={idx}
			onSubmitAction={onSubmitAction}
			isLoading={isLoading}
		>
			{children}
			{footer && <p className="text-muted-foreground text-sm">{footer}</p>}
		</FormContainer>
	);
}
