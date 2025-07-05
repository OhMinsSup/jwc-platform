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
} from "@jwc/ui";
import React from "react";
import { useFormContext } from "react-hook-form";
import type { ComponentData } from "~/types/club";
import { FORM_PLACEHOLDERS } from "../constants";
import type { ClubFormData } from "../types";
import type { FormFieldComponentProps } from "../types";

/**
 * 선택형 질문 필드 컴포넌트
 */
export const SelectQuestionField = React.memo<FormFieldComponentProps>(
	({ component, fieldName }) => {
		const { control } = useFormContext<ClubFormData>();
		const dataFieldName = `data.${fieldName}` as const;

		return (
			<FormField
				control={control}
				name={dataFieldName}
				render={({ field }) => (
					<FormItem className="space-y-3">
						<FormLabel className="font-semibold text-base">
							{component.title}
							{component.data?.required && (
								<span className="ml-1 text-red-500">*</span>
							)}
						</FormLabel>
						{component.description && (
							<FormDescription>{component.description}</FormDescription>
						)}
						<Select
							onValueChange={field.onChange}
							value={String(field.value || "")}
						>
							<FormControl>
								<SelectTrigger className="w-full">
									<SelectValue placeholder={FORM_PLACEHOLDERS.component} />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								{component.data?.data?.map(
									(option: ComponentData, optionIndex: number) => (
										<SelectItem
											key={`select-${component.id}-${option.id || optionIndex}`}
											value={option.name}
										>
											{option.name}
										</SelectItem>
									)
								)}
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>
		);
	}
);

SelectQuestionField.displayName = "SelectQuestionField";
