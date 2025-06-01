import React from "react";
import type { LazyComponentProps } from "~/components/common/ConditionLazyRenderer/ConditionLazyRenderer";
import { FormAttendanceTimeContext } from "~/components/forms/FormContext";
import type { FormFieldSchema } from "~/components/forms/FormContext/FormAttendanceTimeContext";
import { SelectFieldForm } from "~/components/forms/SelectFieldForm";
import { useStepSubmitAction } from "~/libs/hooks/useStepSubmitAction";

export default function FormAttendanceTime({ idx }: LazyComponentProps) {
	const { onSubmitAction, isLoading } = useStepSubmitAction<FormFieldSchema>();

	return (
		<FormAttendanceTimeContext>
			<SelectFieldForm<FormFieldSchema>
				idx={idx}
				name="attendanceTime"
				label="참석하고 싶은 수련회 참석 가능 시간대는 언제인가요?"
				isLoading={isLoading}
				onSubmitAction={onSubmitAction}
				options={[
					{
						name: "오전",
						description: "오전 9시부터 오후 12시",
						value: "AM",
					},
					{
						name: "오후",
						description: "오후 1시부터 오후 6시",
						value: "PM",
					},
					{
						name: "저녁",
						description: "오후 7시부터 오후 10시",
						value: "EVENING",
					},
				]}
			/>
		</FormAttendanceTimeContext>
	);
}
