import React, { useCallback } from "react";
import { useStepAtomHook } from "~/atoms/stepAtom";

export const useStepNavigation = () => {
	const { setStep } = useStepAtomHook();

	const goToNextStep = useCallback(() => {
		setStep((prev) => prev + 1);
	}, [setStep]);

	const goToPreviousStep = useCallback(() => {
		setStep((prev) => prev - 1);
	}, [setStep]);

	const goToStep = useCallback(
		(step: number) => {
			setStep(step);
		},
		[setStep]
	);

	return {
		goToNextStep,
		goToPreviousStep,
		goToStep,
	};
};
