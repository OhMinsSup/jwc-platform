"use client";

import { Label } from "@jwc/ui/components/shadcn/label";
import { cn } from "@jwc/ui/lib/utils";

import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import type { ControllerProps, FieldPath, FieldValues } from "react-hook-form";
import {
	Controller,
	FormProvider,
	useForm,
	useFormContext,
} from "react-hook-form";

const Form = FormProvider;

interface FormFieldContextValue<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
	name: TName;
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
	{} as FormFieldContextValue
);

const FormField = <
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
	...props
}: ControllerProps<TFieldValues, TName>) => (
	<FormFieldContext.Provider value={{ name: props.name }}>
		<Controller {...props} />
	</FormFieldContext.Provider>
);

const useFormField = () => {
	const fieldContext = React.useContext(FormFieldContext);
	const itemContext = React.useContext(FormItemContext);
	const { getFieldState, formState } = useFormContext();

	const fieldState = getFieldState(fieldContext.name, formState);

	if (!fieldContext) {
		throw new Error("useFormField should be used within <FormField>");
	}

	const { id } = itemContext;

	return {
		id,
		name: fieldContext.name,
		formItemId: `${id}-form-item`,
		formDescriptionId: `${id}-form-item-description`,
		formMessageId: `${id}-form-item-message`,
		...fieldState,
	};
};

interface FormItemContextValue {
	id: string;
}

const FormItemContext = React.createContext<FormItemContextValue>(
	{} as FormItemContextValue
);

function FormItem({ className, ref, ...props }: React.ComponentProps<"div">) {
	const id = React.useId();

	return (
		<FormItemContext.Provider value={{ id }}>
			<div
				className={cn("space-y-2", className)}
				data-slot="form-item"
				ref={ref}
				{...props}
			/>
		</FormItemContext.Provider>
	);
}

function FormLabel({
	className,
	ref,
	...props
}: React.ComponentProps<typeof Label>) {
	const { error, formItemId } = useFormField();

	return (
		<Label
			className={cn(error && "text-destructive", className)}
			data-slot="form-label"
			htmlFor={formItemId}
			ref={ref}
			{...props}
		/>
	);
}

function FormControl({ ref, ...props }: React.ComponentProps<typeof Slot>) {
	const { error, formItemId, formDescriptionId, formMessageId } =
		useFormField();

	return (
		<Slot
			aria-describedby={
				error ? `${formDescriptionId} ${formMessageId}` : `${formDescriptionId}`
			}
			aria-invalid={!!error}
			data-slot="form-control"
			id={formItemId}
			ref={ref}
			{...props}
		/>
	);
}

function FormDescription({
	className,
	ref,
	...props
}: React.ComponentProps<"p">) {
	const { formDescriptionId } = useFormField();

	return (
		<p
			className={cn("text-muted-foreground text-sm", className)}
			data-slot="form-description"
			id={formDescriptionId}
			ref={ref}
			{...props}
		/>
	);
}

function FormMessage({
	className,
	children,
	ref,
	...props
}: React.ComponentProps<"p">) {
	const { error, formMessageId } = useFormField();
	const body = error ? String(error.message) : children;

	if (!body) {
		return null;
	}

	return (
		<p
			className={cn("font-medium text-destructive text-sm", className)}
			data-slot="form-message"
			id={formMessageId}
			ref={ref}
			{...props}
		>
			{body}
		</p>
	);
}

export {
	useForm,
	useFormField,
	useFormContext,
	Form,
	FormItem,
	FormLabel,
	FormControl,
	FormDescription,
	FormMessage,
	FormField,
};

export { useFieldArray } from "react-hook-form";
