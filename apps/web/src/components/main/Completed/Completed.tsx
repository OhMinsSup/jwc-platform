import { Button, Icons } from "@jwc/ui";
import React, { useCallback } from "react";
import { useResetStepAtomHook } from "~/atoms/stepAtom";

export default function Completed() {
	const { resetStep } = useResetStepAtomHook();

	const onResetStep = useCallback(() => {
		resetStep();
	}, [resetStep]);

	return (
		<div className="flex h-full flex-col items-center justify-center">
			<Icons.PartyPopper className="h-16 w-16 text-green-500" />
			<h2 className="font-bold text-2xl">감사합니다!</h2>
			<p className="text-lg">수련회 신청을 완료해주셔서 감사합니다!</p>
			<Button type="button" onClick={onResetStep} className="mt-8">
				처음으로
			</Button>
		</div>
	);
}
