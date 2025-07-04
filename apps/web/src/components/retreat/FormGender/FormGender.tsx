import { getGenderOptions } from "@jwc/utils/options";
import React from "react";
import { useStepAtomValue } from "~/atoms/stepAtom";
import type { LazyComponentProps } from "~/components/common/ConditionLazyRenderer/ConditionLazyRenderer";
import { FormGenderContext } from "~/components/forms/FormContext";
import type { FormFieldSchema } from "~/components/forms/FormContext/FormGenderContext";
import { RadioGroupFieldForm } from "~/components/forms/RadioGroupFieldForm";
import { useStepSubmitAction } from "~/libs/hooks/useStepSubmitAction";

export default function FormGender(_: LazyComponentProps) {
	const { onSubmitAction, isLoading } = useStepSubmitAction<FormFieldSchema>();
	const { step } = useStepAtomValue();

	return (
		<FormGenderContext>
			<RadioGroupFieldForm<FormFieldSchema>
				idx={step}
				name="gender"
				label="성별이 어떻게 되시나요?"
				isLoading={isLoading}
				required
				onSubmitAction={onSubmitAction}
				options={getGenderOptions()}
			/>
		</FormGenderContext>
	);
}
