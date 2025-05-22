import React from "react";
import type { LazyComponentProps } from "~/components/common/ConditionLazyRenderer/ConditionLazyRenderer";
import { FormGenderContext } from "~/components/forms/FormContext";
import type { FormFieldSchema } from "~/components/forms/FormContext/FormGenderContext";
import { RadioGroupFieldForm } from "~/components/forms/RadioGroupFieldForm";
import { useStepSubmitAction } from "~/libs/hooks/useStepSubmitAction";

export default function FormGender({ idx }: LazyComponentProps) {
	const { onSubmitAction, isLoading } = useStepSubmitAction<FormFieldSchema>();

	return (
		<FormGenderContext>
			<RadioGroupFieldForm<FormFieldSchema>
				idx={idx}
				name="gender"
				label="성별이 어떻게 되시나요?"
				isLoading={isLoading}
				required
				onSubmitAction={onSubmitAction}
				options={[
					{
						name: "남성",
						value: "남성",
					},
					{
						name: "여성",
						value: "여성",
					},
				]}
			/>
		</FormGenderContext>
	);
}
