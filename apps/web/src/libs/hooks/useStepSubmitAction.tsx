import { useCallback, useTransition } from "react";
import type { FieldValues } from "react-hook-form";
import { useStepAtomHook, useStepMapAtomHook } from "~/atoms/stepAtom";

interface UseStepSubmitActionReturn<TFieldValues extends FieldValues> {
	isLoading: boolean;
	onSubmitAction: (data: TFieldValues) => void;
	canGoNext: boolean;
}

export function useStepSubmitAction<
	TFieldValues extends FieldValues,
>(): UseStepSubmitActionReturn<TFieldValues> {
	const { step, setStep } = useStepAtomHook();
	const { setCurrentStepData, cleanupOldSteps } = useStepMapAtomHook();

	const [isPending, startTransition] = useTransition();

	const onSubmitAction = useCallback(
		(data: TFieldValues) => {
			if (isPending) return; // 중복 실행 방지

			startTransition(() => {
				try {
					// 데이터 저장
					setCurrentStepData(data);

					// 다음 단계로 이동
					setStep((prev) => prev + 1);
				} catch (error) {
					console.error("Failed to submit step data:", error);
					// 에러 처리 로직 추가 가능
				}
			});
		},
		[setStep, setCurrentStepData, isPending]
	);

	// 다음 단계로 진행 가능한지 확인
	const canGoNext = !isPending;

	return {
		isLoading: isPending,
		onSubmitAction,
		canGoNext,
	};
}
