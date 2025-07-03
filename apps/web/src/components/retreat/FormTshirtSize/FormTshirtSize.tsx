import { getTshirtSizeOptions } from "@jwc/utils/options";
import React from "react";
import { useStepAtomValue } from "~/atoms/stepAtom";
import type { LazyComponentProps } from "~/components/common/ConditionLazyRenderer/ConditionLazyRenderer";
import { FormTshirtSizeContext } from "~/components/forms/FormContext";
import type { FormFieldSchema } from "~/components/forms/FormContext/FormTshirtSizeContext";
import { SelectFieldForm } from "~/components/forms/SelectFieldForm";
import { useStepSubmitAction } from "~/libs/hooks/useStepSubmitAction";

export default function FormTshirtSize(_: LazyComponentProps) {
	const { onSubmitAction, isLoading } = useStepSubmitAction<FormFieldSchema>();
	const { step } = useStepAtomValue();

	return (
		<FormTshirtSizeContext>
			<SelectFieldForm<FormFieldSchema>
				idx={step}
				name="tshirtSize"
				label="티셔츠 사이즈는 어떻게 되시나요?"
				isLoading={isLoading}
				onSubmitAction={onSubmitAction}
				options={getTshirtSizeOptions()}
			/>
		</FormTshirtSizeContext>
	);
}
