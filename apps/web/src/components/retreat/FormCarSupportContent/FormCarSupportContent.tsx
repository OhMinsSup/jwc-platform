import React from "react";
import { useStepAtomValue } from "~/atoms/stepAtom";
import type { LazyComponentProps } from "~/components/common/ConditionLazyRenderer/ConditionLazyRenderer";
import { FormCarSupportContentContext } from "~/components/forms/FormContext";
import type { FormFieldSchema } from "~/components/forms/FormContext/FormCarSupportContentContext";
import { TextareaFieldForm } from "~/components/forms/TextareaFieldForm";
import { useStepSubmitAction } from "~/libs/hooks/useStepSubmitAction";

export default function FormCarSupportContent(_: LazyComponentProps) {
	const { onSubmitAction, isLoading } = useStepSubmitAction<FormFieldSchema>();
	const { step } = useStepAtomValue();

	return (
		<FormCarSupportContentContext>
			<TextareaFieldForm<FormFieldSchema>
				idx={step}
				isLoading={isLoading}
				name="carSupportContent"
				label="차량 지원이 가능하시다면 추가적인 내용을 적어주세요."
				onSubmitAction={onSubmitAction}
				description={
					<>
						차량 지원을 선택한 경우 차량 지원에 대한 추가적인 내용을
						입력해주세요.
						<br />
						<strong> 예시) 27일 수련회장으로 저녁 6시, 4명가능</strong>
					</>
				}
			/>
		</FormCarSupportContentContext>
	);
}
