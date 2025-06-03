import { getTfTeamOptions } from "@jwc/utils/options";
import React, { useMemo } from "react";
import type { LazyComponentProps } from "~/components/common/ConditionLazyRenderer/ConditionLazyRenderer";
import { FormTFTeamContext } from "~/components/forms/FormContext";
import type { FormFieldSchema } from "~/components/forms/FormContext/FormTFTeamContext";
import { SelectFieldForm } from "~/components/forms/SelectFieldForm";
import { useStepSubmitAction } from "~/libs/hooks/useStepSubmitAction";

export default function FormTFTeam({ idx }: LazyComponentProps) {
	const { onSubmitAction, isLoading } = useStepSubmitAction<FormFieldSchema>();

	const options = useMemo(() => {
		return getTfTeamOptions().map((option) => {
			if (option.name === "찬양팀") {
				return {
					...option,
					description: (
						<>
							싱어, 악기, 워십 / 기존 찬양팀은
							<br /> 신청하지 않아도 됩니다.
						</>
					),
				};
			}

			if (option.name === "프로그램팀") {
				return {
					...option,
					description: <>수련회 세부 프로그램 기획 및 진행</>,
				};
			}

			if (option.name === "미디어팀") {
				return {
					...option,
					description: (
						<>
							집회 미디어(자막, 조명) / 사진 및 영상촬영/ <br /> 기존 미디어팀은
							신청하지 않아도 됩니다.
						</>
					),
				};
			}

			return option;
		});
	}, []);

	return (
		<FormTFTeamContext>
			<SelectFieldForm<FormFieldSchema>
				idx={idx}
				name="tfTeam"
				label="지원하고 싶은 TF팀이 있으신가요?"
				isLoading={isLoading}
				description="TF팀 지원은 희망자에 한해 지원 가능합니다."
				onSubmitAction={onSubmitAction}
				options={options}
			/>
		</FormTFTeamContext>
	);
}
