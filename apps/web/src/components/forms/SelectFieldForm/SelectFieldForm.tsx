"use client";
import type React from "react";
import { type FieldValues, type Path, useFormContext } from "react-hook-form";
import { FormSelectBoxField } from "~/components/common/FormSelectBoxField";
import type { Options } from "~/components/common/FormSelectBoxField/FormSelectBoxField";
import { FormContainer } from "~/components/forms/FormContainer";
import type { FormContainerProps } from "~/components/forms/FormContainer/FormContainer";
import { FormLabel } from "~/components/forms/FormLabel";
import type { FormLabelProps } from "~/components/forms/FormLabel/FormLabel";

interface SelectFieldFormProps<TFieldValues extends FieldValues>
	extends Omit<FormContainerProps<TFieldValues>, "children">,
		FormLabelProps {
	options: Options;
	name: Path<TFieldValues>;
	description?: React.ReactNode;
}

export default function SelectFieldForm<TFieldValues extends FieldValues>({
	idx,
	required,
	label,
	name,
	description,
	onSubmitAction,
	isLoading,
	options,
}: SelectFieldFormProps<TFieldValues>) {
	return (
		<FormContainer<TFieldValues>
			idx={idx}
			onSubmitAction={onSubmitAction}
			isLoading={isLoading}
		>
			<FormSelectBoxField
				name={name}
				className="space-y-3"
				description={description}
				options={options}
				label={<FormLabel idx={idx} required={required} label={label} />}
				selectProps={{
					required,
					placeholder: "답변을 선택해주세요.",
					autoFocus: true,
					autoComplete: "off",
					"aria-label": `${label} 선택란`,
				}}
			/>
		</FormContainer>
	);
}
