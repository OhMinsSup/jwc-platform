import { useCallback, useTransition } from "react";
import type { FieldValues } from "react-hook-form";
import { useStepAtomHook, useStepMapAtomHook } from "~/atoms/stepAtom";

export function useStepSubmitAction<TFieldValues extends FieldValues>() {
	const { setStep } = useStepAtomHook();
	const { setCurrentStepData } = useStepMapAtomHook();

	const [isPending, startTransition] = useTransition();

	const onSubmitAction = useCallback(
		(data: TFieldValues) => {
			startTransition(() => {
				setCurrentStepData(data);
				setStep((prev) => prev + 1);
			});
		},
		[setStep, setCurrentStepData]
	);

	return {
		isLoading: isPending,
		onSubmitAction,
	};
}
