import React from "react";
import { useStepAtomValue } from "~/atoms/stepAtom";
import type { LazyComponentProps } from "~/components/common/ConditionLazyRenderer/ConditionLazyRenderer";
import { FormPickupDescriptionContext } from "~/components/forms/FormContext";
import type { FormFieldSchema } from "~/components/forms/FormContext/FormPickupDescriptionContext";
import { TextareaFieldForm } from "~/components/forms/TextareaFieldForm";
import { useStepSubmitAction } from "~/libs/hooks/useStepSubmitAction";

export default function FormPickupDescription(_: LazyComponentProps) {
	const { onSubmitAction, isLoading } = useStepSubmitAction<FormFieldSchema>();
	const { step } = useStepAtomValue();

	return (
		<FormPickupDescriptionContext>
			<TextareaFieldForm<FormFieldSchema>
				idx={step}
				isLoading={isLoading}
				name="pickupTimeDesc"
				label="숙소까지 픽업이 필요하신가요? 필요하시면 구체적으로 적어주세요."
				onSubmitAction={onSubmitAction}
				description={
					<>
						부분참일 경우 참석 가능한 시간 혹은 픽업을 원하는 시간을 구체적으로
						적어주세요.
						<strong>
							<br />
							예시) 28일 12시에 교회 도착
						</strong>
					</>
				}
			/>
		</FormPickupDescriptionContext>
	);
}
