"use client";
import type React from "react";
import type { FieldValues, Path } from "react-hook-form";
import { FormInputField } from "~/components/common/FormInputField";
import { FormContainer } from "~/components/forms/FormContainer";
import type { FormContainerProps } from "~/components/forms/FormContainer/FormContainer";
import { FormLabel } from "~/components/forms/FormLabel";
import type { FormLabelProps } from "~/components/forms/FormLabel/FormLabel";

interface InputFieldFormProps<TFieldValues extends FieldValues>
	extends Omit<FormContainerProps<TFieldValues>, "children">,
		FormLabelProps {
	name: Path<TFieldValues>;
	description?: React.ReactNode;
}

export default function InputFieldForm<TFieldValues extends FieldValues>({
	idx,
	label,
	name,
	description,
	onSubmitAction,
	isLoading,
	required,
}: InputFieldFormProps<TFieldValues>) {
	return (
		<FormContainer<TFieldValues>
			idx={idx}
			onSubmitAction={onSubmitAction}
			isLoading={isLoading}
		>
			<FormInputField
				name={name}
				className="space-y-3"
				description={description}
				label={<FormLabel idx={idx} required={required} label={label} />}
				inputProps={{
					required,
					placeholder: "여기에 답변을 입력하세요.",
					autoFocus: true,
					autoComplete: "off",
					"aria-label": `${label} 입력란`,
				}}
			/>
		</FormContainer>
	);
}
