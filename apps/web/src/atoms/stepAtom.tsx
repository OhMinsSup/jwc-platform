import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useMemo } from "react";
import { STEP_CONFIG, isFormStep, isValidStep } from "~/atoms/stepConfig";

// Types for better type safety
interface StepData {
	[key: string]: unknown;
}

interface StepMap extends Map<number, StepData> {}

// 현재 step을 관리하는 atom
const stepAtom = atom(0);

// step에 연결된 데이터를 관리하는 Map 객체 atom with cleanup
const stepMapAtom = atom<StepMap>(new Map());

// 현재 step에 해당하는 데이터를 선언적으로 가져오는 atom
const currentStepDataAtom = atom(
	(get): StepData | null => {
		const step = get(stepAtom);
		const stepMap = get(stepMapAtom);
		return stepMap.get(step) || null;
	},
	(get, set, update: StepData) => {
		const step = get(stepAtom);
		const stepMap = get(stepMapAtom);
		const newMap = new Map(stepMap);
		newMap.set(step, update);
		set(stepMapAtom, newMap);
	}
);

export function useStepAtomHook() {
	const [step, setStep] = useAtom(stepAtom);
	return { step, setStep };
}

export function useStepAtomValue() {
	const step = useAtomValue(stepAtom);
	const stepMap = useAtomValue(stepMapAtom);
	return {
		step,
		stepMap,
	};
}

export function useStepProgressAtomHook() {
	const { step, stepMap } = useStepAtomValue();

	const progress = useMemo(() => {
		if (step <= 0) return 0;
		if (step > STEP_CONFIG.TOTAL_COUNT) return 100;

		const completedSteps = Array.from(stepMap.keys()).filter(
			(key) => key < step && key >= 1
		);

		const progressValue =
			(completedSteps.length / STEP_CONFIG.TOTAL_COUNT) * 100;
		return Math.min(progressValue, 100);
	}, [step, stepMap]);

	const stepInfo = useMemo(
		() => ({
			current: step,
			total: STEP_CONFIG.TOTAL_COUNT,
			isWelcome: step === 0,
			isForm: isFormStep(step),
			isConfirm: step === STEP_CONFIG.CONFIRM_STEP,
			isCompleted: step === STEP_CONFIG.COMPLETED_STEP,
			isValid: isValidStep(step),
		}),
		[step]
	);

	return { step, progress, stepInfo };
}

export function useStepMapAtomHook() {
	const step = useAtomValue(stepAtom);
	const [currentStepData, setCurrentStepData] = useAtom(currentStepDataAtom);
	const [stepMap, setStepMap] = useAtom(stepMapAtom);

	// 현재 step의 데이터를 삭제
	const deleteCurrentStepData = useCallback(() => {
		setStepMap((prev) => {
			const newMap = new Map(prev);
			newMap.delete(step);
			return newMap;
		});
	}, [setStepMap, step]);

	// 메모리 최적화: 오래된 step 데이터 정리
	const cleanupOldSteps = useCallback(
		(keepStepsCount = 5) => {
			setStepMap((prev) => {
				const newMap = new Map(prev);
				const sortedSteps = Array.from(newMap.keys()).sort((a, b) => b - a);

				// 최근 N개 step만 유지
				const stepsToDelete = sortedSteps.slice(keepStepsCount);
				for (const stepToDelete of stepsToDelete) {
					newMap.delete(stepToDelete);
				}
				return newMap;
			});
		},
		[setStepMap]
	);

	return {
		currentStepData,
		setCurrentStepData,
		stepMap,
		deleteCurrentStepData,
		cleanupOldSteps,
	};
}

export function useResetStepAtomHook() {
	const setStep = useSetAtom(stepAtom);
	const setMapAtom = useSetAtom(stepMapAtom);

	// step을 초기화하고, stepMap을 비우고, total을 초기화
	const resetStep = useCallback(() => {
		setStep(1); // step을 1로 초기화
		setMapAtom(new Map()); // stepMap을 비움
	}, [setStep, setMapAtom]);

	const resetToWelcome = useCallback(() => {
		setStep(0); // 웰컴 화면으로 초기화
		setMapAtom(new Map()); // stepMap을 비움
	}, [setStep, setMapAtom]);

	return { resetStep, resetToWelcome };
}
