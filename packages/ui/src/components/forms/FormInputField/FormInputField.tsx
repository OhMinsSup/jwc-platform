"use client";

import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@jwc/ui/components/shadcn/form";
import { Input } from "@jwc/ui/components/shadcn/input";
import type { Control, FieldPath, FieldValues } from "react-hook-form";

interface FormInputFieldProps<T extends FieldValues> {
	control: Control<T>;
	name: FieldPath<T>;
	label?: string;
	placeholder?: string;
	type?: string;
	required?: boolean;
	disabled?: boolean;
	autoComplete?: string;
}

export function FormInputField<T extends FieldValues>({
	control,
	name,
	label,
	placeholder,
	type = "text",
	required = false,
	disabled = false,
	autoComplete,
}: FormInputFieldProps<T>) {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem>
					{label && <FormLabel>{label}</FormLabel>}
					<FormControl>
						<Input
							{...field}
							autoComplete={autoComplete}
							disabled={disabled}
							placeholder={placeholder}
							required={required}
							type={type}
						/>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}
