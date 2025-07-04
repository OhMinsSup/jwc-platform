import React from "react";
import { useStepAtomValue } from "~/atoms/stepAtom";
import type { LazyComponentProps } from "~/components/common/ConditionLazyRenderer/ConditionLazyRenderer";
import { FormNameContext } from "~/components/forms/FormContext";
import type { FormFieldSchema } from "~/components/forms/FormContext/FormNameContext";
import { InputFieldForm } from "~/components/forms/InputFieldForm";
import { useStepSubmitAction } from "~/libs/hooks/useStepSubmitAction";

export default function FormName(_: LazyComponentProps) {
	const { onSubmitAction, isLoading } = useStepSubmitAction<FormFieldSchema>();
	const { step } = useStepAtomValue();

	return (
		<FormNameContext>
			<InputFieldForm<FormFieldSchema>
				idx={step}
				isLoading={isLoading}
				name="name"
				required
				label="이름이 어떻게 되시나요?"
				onSubmitAction={onSubmitAction}
			/>
		</FormNameContext>
	);
}
