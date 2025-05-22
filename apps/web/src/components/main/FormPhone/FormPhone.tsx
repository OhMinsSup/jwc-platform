import React from "react";
import type { LazyComponentProps } from "~/components/common/ConditionLazyRenderer/ConditionLazyRenderer";
import { FormPhoneContext } from "~/components/forms/FormContext";
import type { FormFieldSchema } from "~/components/forms/FormContext/FormPhoneContext";
import { InputFieldForm } from "~/components/forms/InputFieldForm";
import { useStepSubmitAction } from "~/libs/hooks/useStepSubmitAction";

export default function FormPhone({ idx }: LazyComponentProps) {
	const { onSubmitAction, isLoading } = useStepSubmitAction<FormFieldSchema>();

	return (
		<FormPhoneContext>
			<InputFieldForm<FormFieldSchema>
				idx={idx}
				isLoading={isLoading}
				name="phone"
				required
				label="연락처가 어떻게 되시나요?"
				description="연락처를 입력해주세요. (ex. 01012345678)"
				onSubmitAction={onSubmitAction}
			/>
		</FormPhoneContext>
	);
}
