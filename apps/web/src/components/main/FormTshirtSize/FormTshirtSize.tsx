import React from "react";
import type { LazyComponentProps } from "~/components/common/ConditionLazyRenderer/ConditionLazyRenderer";
import { FormTshirtSizeContext } from "~/components/forms/FormContext";
import type { FormFieldSchema } from "~/components/forms/FormContext/FormTshirtSizeContext";
import { SelectFieldForm } from "~/components/forms/SelectFieldForm";
import { useStepSubmitAction } from "~/libs/hooks/useStepSubmitAction";

const options = ["s", "m", "l", "xl", "2xl", "3xl"];

export default function FormTshirtSize({ idx }: LazyComponentProps) {
	const { onSubmitAction, isLoading } = useStepSubmitAction<FormFieldSchema>();

	return (
		<FormTshirtSizeContext>
			<SelectFieldForm<FormFieldSchema>
				idx={idx}
				name="tshirtSize"
				label="티셔츠 사이즈는 어떻게 되시나요?"
				isLoading={isLoading}
				onSubmitAction={onSubmitAction}
				options={options.map((size) => ({
					name: `${size.toUpperCase()} 사이즈`,
					value: size,
				}))}
			/>
		</FormTshirtSizeContext>
	);
}
