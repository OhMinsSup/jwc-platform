import { getDepartmentOptions } from "@jwc/utils/options";
import React from "react";
import type { LazyComponentProps } from "~/components/common/ConditionLazyRenderer/ConditionLazyRenderer";
import { FormDepartmentContext } from "~/components/forms/FormContext";
import type { FormFieldSchema } from "~/components/forms/FormContext/FormDepartmentContext";
import { RadioGroupFieldForm } from "~/components/forms/RadioGroupFieldForm";
import { useStepSubmitAction } from "~/libs/hooks/useStepSubmitAction";

export default function FormDepartment({ idx }: LazyComponentProps) {
	const { onSubmitAction, isLoading } = useStepSubmitAction<FormFieldSchema>();

	return (
		<FormDepartmentContext>
			<RadioGroupFieldForm<FormFieldSchema>
				idx={idx}
				name="department"
				label="부서가 어떻게 되시나요?"
				isLoading={isLoading}
				required
				onSubmitAction={onSubmitAction}
				options={getDepartmentOptions()}
			/>
		</FormDepartmentContext>
	);
}
