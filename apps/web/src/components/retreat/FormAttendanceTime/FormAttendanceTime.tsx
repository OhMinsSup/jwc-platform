import React from "react";
import { useStepAtomValue } from "~/atoms/stepAtom";
import type { LazyComponentProps } from "~/components/common/ConditionLazyRenderer/ConditionLazyRenderer";
import FormDateField from "~/components/common/FormDateField/FormDateField";
import { FormAttendanceTimeContext } from "~/components/forms/FormContext";
import type { FormFieldSchema } from "~/components/forms/FormContext/FormAttendanceTimeContext";
import { FormField } from "~/components/forms/FormField";
import { useStepSubmitAction } from "~/libs/hooks/useStepSubmitAction";

export default function FormAttendanceTime(_: LazyComponentProps) {
	const { onSubmitAction, isLoading } = useStepSubmitAction<FormFieldSchema>();
	const { step } = useStepAtomValue();

	return (
		<FormAttendanceTimeContext>
			<FormField
				idx={step}
				isLoading={isLoading}
				onSubmitAction={onSubmitAction}
				footer="원하는 날짜와 시간을 선택해주세요"
			>
				<FormDateField<FormFieldSchema>
					idx={step}
					name="attendanceTime"
					label="참석하고 싶은 수련회 참석 날짜와 시간을 선택해주세요"
					dateFormat="yyyy년 MM월 dd일"
					enableTime={true}
					timeFormat="HH:mm"
					inputProps={{ required: true }}
				/>
			</FormField>
		</FormAttendanceTimeContext>
	);
}
