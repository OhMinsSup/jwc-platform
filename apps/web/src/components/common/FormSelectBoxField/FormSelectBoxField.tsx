"use client";

import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	cn,
} from "@jwc/ui";
import type React from "react";
import { type FieldValues, type Path, useFormContext } from "react-hook-form";

type Option = {
	name: string;
	value: string;
	description?: React.ReactNode;
};

export type Options = Option[];

type FormSelectBoxFieldProps<TFieldValues extends FieldValues> = {
	label: React.ReactNode;
	selectProps?: Omit<
		React.SelectHTMLAttributes<HTMLSelectElement>,
		"name" | "ref" | "onChange" | "value" | "onBlur" | "disabled"
	> & {
		placeholder?: string;
	};
	description?: React.ReactNode;
	className?: string;
	name: Path<TFieldValues>;
	options: Options;
};

export default function FormSelectBoxField<TFieldValues extends FieldValues>({
	label,
	name,
	description,
	selectProps,
	className,
	options,
}: FormSelectBoxFieldProps<TFieldValues>) {
	const { control } = useFormContext<TFieldValues>();

	return (
		<FormField
			control={control}
			name={name}
			render={({ field: { onChange, ...field } }) => {
				return (
					<FormItem className={cn("flex flex-col", className)}>
						{typeof label === "string" ? (
							<FormLabel
								data-required={selectProps?.required ?? false}
								className={cn(
									"data-[required='true']:before:mr-[var(--ant-margin-xxs)] data-[required='true']:before:inline-block data-[required='true']:before:text-red-500 data-[required='true']:before:content-['*']"
								)}
							>
								{label}
							</FormLabel>
						) : (
							label
						)}
						<Select onValueChange={onChange} {...field}>
							<FormControl>
								<SelectTrigger>
									<SelectValue {...selectProps} />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								{options.map((option) => (
									<SelectItem
										value={option.value}
										key={`select:${option.value}`}
									>
										<div className="flex justify-start">
											<span>{option.name}</span>
										</div>
										{option.description && (
											<span className="text-muted-foreground">
												{option.description}
											</span>
										)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{description ? (
							<FormDescription>{description}</FormDescription>
						) : null}
						<FormMessage />
					</FormItem>
				);
			}}
		/>
	);
}
