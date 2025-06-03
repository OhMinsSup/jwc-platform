import { getAttendanceTimeOptions } from "@jwc/utils/options";
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
				options={getAttendanceTimeOptions()}
			/>
		</FormAttendanceTimeContext>
	);
}
