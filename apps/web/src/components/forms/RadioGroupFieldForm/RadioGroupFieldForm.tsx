"use client";
import type React from "react";
import type { FieldValues, Path } from "react-hook-form";
import { FormRadioGroupField } from "~/components/common/FormRadioGroupField";
import type { Options } from "~/components/common/FormRadioGroupField/FormRadioGroupField";
import { FormContainer } from "~/components/forms/FormContainer";
import type { FormContainerProps } from "~/components/forms/FormContainer/FormContainer";
import { FormLabel } from "~/components/forms/FormLabel";
import type { FormLabelProps } from "~/components/forms/FormLabel/FormLabel";

interface RadioGroupFieldFormProps<TFieldValues extends FieldValues>
	extends Omit<FormContainerProps<TFieldValues>, "children">,
		FormLabelProps {
	name: Path<TFieldValues>;
	options: Options;
	description?: React.ReactNode;
}

export default function RadioGroupFieldForm<TFieldValues extends FieldValues>({
	idx,
	label,
	name,
	description,
	options,
	isLoading,
	required,
	onSubmitAction,
}: RadioGroupFieldFormProps<TFieldValues>) {
	return (
		<FormContainer<TFieldValues>
			idx={idx}
			onSubmitAction={onSubmitAction}
			isLoading={isLoading}
		>
			<FormRadioGroupField
				name={name}
				className="space-y-3"
				description={description}
				options={options}
				label={<FormLabel idx={idx} required={required} label={label} />}
				radioProps={{
					required,
					autoFocus: true,
					"aria-label": `${label} 선택란`,
				}}
			/>
		</FormContainer>
	);
}
