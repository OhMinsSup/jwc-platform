import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Switch,
	cn,
} from "@jwc/ui";
import type React from "react";
import { type FieldValues, type Path, useFormContext } from "react-hook-form";

type FormSwitchFieldProps<TFieldValues extends FieldValues> = {
	label: React.ReactNode;
	description?: React.ReactNode;
	beforeDescription?: React.ReactNode;
	afterDescription?: React.ReactNode;
	className?: string;
	name: Path<TFieldValues>;
};

export default function FormSwitchField<TFieldValues extends FieldValues>({
	label,
	name,
	className,
	description,
	beforeDescription,
	afterDescription,
}: FormSwitchFieldProps<TFieldValues>) {
	const { control } = useFormContext<TFieldValues>();

	return (
		<FormField
			control={control}
			name={name}
			render={({ field: { value, onChange, ...field } }) => (
				<FormItem className={cn("flex flex-col justify-start", className)}>
					<div className="space-y-0.5">
						{typeof label === "string" ? (
							<FormLabel className="space-x-3 text-base">{label}</FormLabel>
						) : (
							label
						)}
						{beforeDescription}
						{description ? (
							<FormDescription>{description}</FormDescription>
						) : null}
						{afterDescription}
						<FormMessage />
					</div>
					<FormControl>
						<Switch checked={value} onCheckedChange={onChange} {...field} />
					</FormControl>
				</FormItem>
			)}
		/>
	);
}
