import React from "react";
import type { LazyComponentProps } from "~/components/common/ConditionLazyRenderer/ConditionLazyRenderer";
import { FormPickupDescriptionContext } from "~/components/forms/FormContext";
import type { FormFieldSchema } from "~/components/forms/FormContext/FormPickupDescriptionContext";
import { TextareaFieldForm } from "~/components/forms/TextareaFieldForm";
import { useStepSubmitAction } from "~/libs/hooks/useStepSubmitAction";

export default function FormPickupDescription({ idx }: LazyComponentProps) {
	const { onSubmitAction, isLoading } = useStepSubmitAction<FormFieldSchema>();

	return (
		<FormPickupDescriptionContext>
			<TextareaFieldForm<FormFieldSchema>
				idx={idx}
				isLoading={isLoading}
				name="pickupTimeDesc"
				label="숙소까지 픽업이 필요하신가요? 필요하시면 구체적으로 적어주세요."
				onSubmitAction={onSubmitAction}
				description={
					<>
						부분참일 경우 참석 가능한 시간 혹은 픽업을 원하는 시간을 구체적으로
						적어주세요. <br />
						<strong>
							경기광주역으로 도착하는 시간을 적어주셔야 합니다.
							<br />
							예시) 28일 12시에 경기광주역 도착
						</strong>
					</>
				}
			/>
		</FormPickupDescriptionContext>
	);
}
