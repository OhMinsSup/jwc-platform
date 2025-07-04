"use client";
import type React from "react";
import { memo, useCallback } from "react";
import { type FieldValues, useFormContext } from "react-hook-form";
import { ButtonSubmitAction } from "~/components/common/ButtonSubmitAction";
import type { LazyComponentProps } from "~/components/common/ConditionLazyRenderer/ConditionLazyRenderer";
import { useStepNavigation } from "~/libs/hooks/useStepNavigation";
import { useStepAtomValue } from "../../../atoms/stepAtom";

export interface FormContainerProps<TFieldValues extends FieldValues>
	extends Pick<LazyComponentProps, "idx"> {
	isLoading?: boolean;
	children: React.ReactNode;
	onSubmitAction: (data: TFieldValues) => void;
}

function FormContainer<TFieldValues extends FieldValues>({
	idx,
	isLoading = false,
	children,
	onSubmitAction,
}: FormContainerProps<TFieldValues>) {
	const { handleSubmit } = useFormContext<TFieldValues>();
	const { goToPreviousStep } = useStepNavigation();
	const { step } = useStepAtomValue();

	// 폼 제출 핸들러 메모화
	const handleFormSubmit = useCallback(
		(event: React.FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			if (isLoading) return; // 로딩 중 중복 제출 방지
			handleSubmit(onSubmitAction)(event);
		},
		[handleSubmit, onSubmitAction, isLoading]
	);

	// 키보드 이벤트 핸들러 (Enter 키 처리)
	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLFormElement>) => {
			if (event.key === "Enter" && !event.shiftKey) {
				event.preventDefault();
				if (!isLoading) {
					handleSubmit(onSubmitAction)();
				}
			}
		},
		[handleSubmit, onSubmitAction, isLoading]
	);

	return (
		<form
			className="flex flex-col space-y-4"
			onSubmit={handleFormSubmit}
			onKeyDown={handleKeyDown}
			noValidate // 브라우저 기본 검증 비활성화 (커스텀 검증 사용)
		>
			{children}
			<ButtonSubmitAction
				isLoading={isLoading}
				idx={idx}
				onPreviousNavigation={goToPreviousStep}
			/>
		</form>
	);
}

export default memo(FormContainer) as <TFieldValues extends FieldValues>(
	props: FormContainerProps<TFieldValues>
) => React.ReactElement;
