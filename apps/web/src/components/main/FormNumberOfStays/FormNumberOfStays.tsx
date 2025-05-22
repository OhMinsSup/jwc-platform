import React from "react";
import type { LazyComponentProps } from "~/components/common/ConditionLazyRenderer/ConditionLazyRenderer";
import { FormNumberOfStaysContext } from "~/components/forms/FormContext";
import type { FormFieldSchema } from "~/components/forms/FormContext/FormNumberOfStaysContext";
import { SelectFieldForm } from "~/components/forms/SelectFieldForm";
import { useStepSubmitAction } from "~/libs/hooks/useStepSubmitAction";

export default function FormNumberOfStays({ idx }: LazyComponentProps) {
	const { onSubmitAction, isLoading } = useStepSubmitAction<FormFieldSchema>();

	return (
		<FormNumberOfStaysContext>
			<SelectFieldForm<FormFieldSchema>
				idx={idx}
				name="numberOfStays"
				label="참석하고 싶은 수련회 일정은 언제인가요?"
				isLoading={isLoading}
				onSubmitAction={onSubmitAction}
				options={[
					{
						name: "3박4일",
						description: "전체참여",
						value: "3박4일",
					},
					{
						name: "2박3일",
						description: "부분참여",
						value: "2박3일",
					},
					{
						name: "1박2일",
						description: "부분참여",
						value: "1박2일",
					},
					{
						name: "무박",
						description: "부분참여",
						value: "무박",
					},
				]}
			/>
		</FormNumberOfStaysContext>
	);
}
