import type React from "react";

import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	RadioGroup,
	RadioGroupItem,
	cn,
} from "@jwc/ui";
import { type FieldValues, type Path, useFormContext } from "react-hook-form";

type Option = {
	name: string;
	value: string;
};

export type Options = Option[];

type FormRadioGroupFieldProps<TFieldValues extends FieldValues> = {
	label: React.ReactNode;
	required?: boolean;
	radioProps?: Omit<
		React.InputHTMLAttributes<HTMLInputElement>,
		"name" | "ref" | "onChange" | "value" | "onBlur" | "disabled" | "dir"
	>;
	description?: React.ReactNode;
	name: Path<TFieldValues>;
	className?: string;
	options: Options;
};

export default function FormRadioGroupField<TFieldValues extends FieldValues>({
	label,
	name,
	description,
	radioProps,
	options,
	className,
}: FormRadioGroupFieldProps<TFieldValues>) {
	const { control } = useFormContext<TFieldValues>();

	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem className={cn(className)}>
					{typeof label === "string" ? (
						<FormLabel
							data-required={radioProps?.required ?? false}
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
						<RadioGroup
							{...radioProps}
							onValueChange={field.onChange}
							defaultValue={field.value}
							className="flex flex-row items-center gap-6"
						>
							{options.map((option) => (
								<FormItem
									className="flex items-center space-x-3 space-y-0"
									key={`radio:${option.value}`}
								>
									<FormControl>
										<RadioGroupItem value={option.value} />
									</FormControl>
									<FormLabel className="font-normal">{option.name}</FormLabel>
								</FormItem>
							))}
						</RadioGroup>
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
