import { getAttendanceDayOptions } from "@jwc/utils/options";
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
				options={getAttendanceDayOptions()}
			/>
		</FormAttendanceDayContext>
	);
}
