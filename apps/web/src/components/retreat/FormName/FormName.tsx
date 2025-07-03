import React from "react";
import type { LazyComponentProps } from "~/components/common/ConditionLazyRenderer/ConditionLazyRenderer";
import { FormNameContext } from "~/components/forms/FormContext";
import type { FormFieldSchema } from "~/components/forms/FormContext/FormNameContext";
import { InputFieldForm } from "~/components/forms/InputFieldForm";
import { useStepSubmitAction } from "~/libs/hooks/useStepSubmitAction";

export default function FormName({ idx }: LazyComponentProps) {
	const { onSubmitAction, isLoading } = useStepSubmitAction<FormFieldSchema>();

	return (
		<FormNameContext>
			<InputFieldForm<FormFieldSchema>
				idx={idx}
				isLoading={isLoading}
				name="name"
				required
				label="이름이 어떻게 되시나요?"
				onSubmitAction={onSubmitAction}
			/>
		</FormNameContext>
	);
}
