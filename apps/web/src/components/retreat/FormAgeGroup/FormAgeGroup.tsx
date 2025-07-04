import React from "react";
import { useStepAtomValue } from "~/atoms/stepAtom";
import type { LazyComponentProps } from "~/components/common/ConditionLazyRenderer/ConditionLazyRenderer";
import { FormAgeGroupContext } from "~/components/forms/FormContext";
import type { FormFieldSchema } from "~/components/forms/FormContext/FormAgeGroupContext";
import { InputFieldForm } from "~/components/forms/InputFieldForm";
import { useStepSubmitAction } from "~/libs/hooks/useStepSubmitAction";

export default function FormAgeGroup(_: LazyComponentProps) {
	const { onSubmitAction, isLoading } = useStepSubmitAction<FormFieldSchema>();
	const { step } = useStepAtomValue();

	return (
		<FormAgeGroupContext>
			<InputFieldForm<FormFieldSchema>
				idx={step}
				isLoading={isLoading}
				name="ageGroup"
				required
				label="또래가 어떻게 되시나요?"
				description={
					<>
						또래 정보를 입력해줘야 구분을 할 수 있습니다. <br />
						<strong>예시)00또래, 95또래, 98또래</strong>
					</>
				}
				onSubmitAction={onSubmitAction}
			/>
		</FormAgeGroupContext>
	);
}
