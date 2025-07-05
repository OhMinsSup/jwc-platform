import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Textarea,
} from "@jwc/ui";
import React from "react";
import { useFormContext } from "react-hook-form";
import { FORM_PLACEHOLDERS } from "../constants";
import type { ClubFormData } from "../types";
import type { FormFieldComponentProps } from "../types";

/**
 * 서술형 질문 필드 컴포넌트
 */
export const TextareaQuestionField = React.memo<FormFieldComponentProps>(
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
						<FormControl>
							<Textarea
								placeholder={FORM_PLACEHOLDERS.description}
								className="min-h-[120px] resize-none"
								{...field}
								value={String(field.value || "")}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		);
	}
);

TextareaQuestionField.displayName = "TextareaQuestionField";
