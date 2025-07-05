import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	RadioGroup,
	RadioGroupItem,
} from "@jwc/ui";
import React from "react";
import { useFormContext } from "react-hook-form";
import type { ComponentData } from "~/types/club";
import type { ClubFormData } from "../types";
import type { FormFieldComponentProps } from "../types";

/**
 * 라디오 버튼 질문 필드 컴포넌트
 */
export const RadioQuestionField = React.memo<FormFieldComponentProps>(
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
							<RadioGroup
								onValueChange={field.onChange}
								value={String(field.value || "")}
								className="flex flex-col space-y-2"
							>
								{component.data?.data?.map(
									(option: ComponentData, optionIndex: number) => {
										// radio 타입인 경우 value를 사용, 없으면 name을 사용
										const radioValue =
											option.value !== undefined
												? String(option.value)
												: option.name;

										return (
											<div
												key={`radio-${component.id}-${option.id || optionIndex}`}
												className="flex items-center space-x-3"
											>
												<RadioGroupItem
													value={radioValue}
													id={`${component.id}-${option.id || optionIndex}`}
												/>
												<label
													htmlFor={`${component.id}-${option.id || optionIndex}`}
													className="cursor-pointer font-normal text-sm"
												>
													{option.name}
												</label>
											</div>
										);
									}
								)}
							</RadioGroup>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		);
	}
);

RadioQuestionField.displayName = "RadioQuestionField";
