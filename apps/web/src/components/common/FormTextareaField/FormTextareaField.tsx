import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Textarea,
	cn,
} from "@jwc/ui";
import type React from "react";
import { type FieldValues, type Path, useFormContext } from "react-hook-form";

type FormTextareaFieldProps<TFieldValues extends FieldValues> = {
	label: React.ReactNode;
	textareaProps?: Omit<
		React.TextareaHTMLAttributes<HTMLTextAreaElement>,
		"name" | "ref" | "onChange" | "value" | "onBlur" | "disabled"
	>;
	description?: React.ReactNode;
	name: Path<TFieldValues>;
	className?: string;
	count?: React.ReactNode;
};

export default function FormTextareaField<TFieldValues extends FieldValues>({
	label,
	name,
	description,
	textareaProps,
	className,
	count,
}: FormTextareaFieldProps<TFieldValues>) {
	const { control } = useFormContext<TFieldValues>();

	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem className={cn(className)}>
					{typeof label === "string" ? (
						<FormLabel
							data-required={textareaProps?.required ?? false}
							className={cn(
								"data-[required='true']:before:mr-[var(--ant-margin-xxs)] data-[required='true']:before:inline-block data-[required='true']:before:text-red-500 data-[required='true']:before:content-['*']"
							)}
						>
							{label}
						</FormLabel>
					) : (
						label
					)}
					<FormControl>
						<Textarea {...textareaProps} {...field} />
					</FormControl>
					{description ? (
						<FormDescription>{description}</FormDescription>
					) : null}
					<FormMessage />
					{count}
				</FormItem>
			)}
		/>
	);
}
