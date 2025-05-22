import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	cn,
} from "@jwc/ui";
import type React from "react";
import { type FieldValues, type Path, useFormContext } from "react-hook-form";

type FormInputFieldProps<TFieldValues extends FieldValues> = {
	label: React.ReactNode;
	inputProps?: Omit<
		React.InputHTMLAttributes<HTMLInputElement>,
		"name" | "ref" | "onChange" | "value" | "onBlur" | "disabled"
	>;
	description?: React.ReactNode;
	className?: string;
	name: Path<TFieldValues>;
};

export default function FormInputField<TFieldValues extends FieldValues>({
	label,
	name,
	description,
	inputProps,
	className,
}: FormInputFieldProps<TFieldValues>) {
	const { control } = useFormContext<TFieldValues>();

	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem className={cn(className)}>
					{typeof label === "string" ? (
						<FormLabel
							data-required={inputProps?.required ?? false}
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
						<Input {...inputProps} {...field} />
					</FormControl>
					{description ? (
						<FormDescription>{description}</FormDescription>
					) : null}
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}
