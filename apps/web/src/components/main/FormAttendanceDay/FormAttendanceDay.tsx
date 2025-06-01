import React from "react";
import type { LazyComponentProps } from "~/components/common/ConditionLazyRenderer/ConditionLazyRenderer";
import { FormAttendanceDayContext } from "~/components/forms/FormContext";
import type { FormFieldSchema } from "~/components/forms/FormContext/FormAttendanceDayContext";
import { SelectFieldForm } from "~/components/forms/SelectFieldForm";
import { useStepSubmitAction } from "~/libs/hooks/useStepSubmitAction";

export default function FormAttendanceDay({ idx }: LazyComponentProps) {
	const { onSubmitAction, isLoading } = useStepSubmitAction<FormFieldSchema>();

	return (
		<FormAttendanceDayContext>
			<SelectFieldForm<FormFieldSchema>
				idx={idx}
				name="attendanceDay"
				label="참석하고 싶은 수련회 참석 가능 일정은 언제인가요?"
				isLoading={isLoading}
				onSubmitAction={onSubmitAction}
				options={[
					{
						name: "6월 19일",
						value: "19",
					},
					{
						name: "6월 20일",
						value: "20",
					},
					{
						name: "6월 21일",
						value: "21",
					},
					{
						name: "6월 22일",
						value: "22",
					},
				]}
			/>
		</FormAttendanceDayContext>
	);
}
