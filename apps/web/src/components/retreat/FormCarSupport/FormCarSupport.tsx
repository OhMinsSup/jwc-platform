import React from "react";
import type { LazyComponentProps } from "~/components/common/ConditionLazyRenderer/ConditionLazyRenderer";
import { FormCarSupportContext } from "~/components/forms/FormContext";
import type { FormFieldSchema } from "~/components/forms/FormContext/FormCarSupportContext";
import { SwitchFieldForm } from "~/components/forms/SwitchFieldForm";
import { useStepSubmitAction } from "~/libs/hooks/useStepSubmitAction";

export default function FormCarSupport({ idx }: LazyComponentProps) {
	const { onSubmitAction, isLoading } = useStepSubmitAction<FormFieldSchema>();

	return (
		<FormCarSupportContext>
			<SwitchFieldForm<FormFieldSchema>
				idx={idx}
				isLoading={isLoading}
				name="carSupport"
				label="차량 지원이 가능하신가요?"
				description="운전자에 한해서 차량지원을 받습니다."
				onSubmitAction={onSubmitAction}
			/>
		</FormCarSupportContext>
	);
}
