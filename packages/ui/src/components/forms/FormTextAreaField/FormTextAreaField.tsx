"use client";

import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@jwc/ui/components/shadcn/form";
import { Textarea } from "@jwc/ui/components/shadcn/textarea";
import type { Control, FieldPath, FieldValues } from "react-hook-form";

interface FormTextAreaFieldProps<T extends FieldValues> {
	control: Control<T>;
	name: FieldPath<T>;
	label?: string;
	placeholder?: string;
	rows?: number;
	required?: boolean;
	disabled?: boolean;
}

export function FormTextAreaField<T extends FieldValues>({
	control,
	name,
	label,
	placeholder,
	rows = 3,
	required = false,
	disabled = false,
}: FormTextAreaFieldProps<T>) {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem>
					{label && <FormLabel>{label}</FormLabel>}
					<FormControl>
						<Textarea
							{...field}
							placeholder={placeholder}
							rows={rows}
							disabled={disabled}
							required={required}
						/>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}
