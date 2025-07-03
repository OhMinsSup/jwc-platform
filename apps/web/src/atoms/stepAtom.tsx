import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useMemo } from "react";
import { TOTAL_STEP_COUNT } from "~/components/retreat/Page";

// 현재 step을 관리하는 atom
const stepAtom = atom(0);

// step에 연결된 데이터를 관리하는 Map 객체 atom
const stepMapAtom = atom(new Map<number, unknown>());

// 현재 step에 해당하는 데이터를 선언적으로 가져오는 atom
const currentStepDataAtom = atom(
	(get) => {
		const step = get(stepAtom); // 현재 step 값 가져오기
		const stepMap = get(stepMapAtom); // stepMap 가져오기
		return stepMap.get(step) || null; // 현재 step에 해당하는 데이터 반환
	},
	(get, set, update) => {
		const step = get(stepAtom); // 현재 step 값 가져오기
		const stepMap = get(stepMapAtom); // stepMap 가져오기
		const newMap = new Map(stepMap); // 기존 Map 복사
		newMap.set(step, update); // 현재 step에 데이터 업데이트
		set(stepMapAtom, newMap); // 업데이트된 Map 저장
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
		const completedSteps = Array.from(stepMap.keys()).filter(
			(key) => key < step
		);
		return (completedSteps.length / TOTAL_STEP_COUNT) * 100; // 진행률 계산
	}, [step, stepMap]);
	// 진행률 계산: 완료된 단계 수를 전체 단계 수로 나누고 100을 곱하여 백분율로 변환
	// 예: 1단계 완료 -> (1/3) * 100 = 33.33%
	// 예: 2단계 완료 -> (2/3) * 100 = 66.67%
	// 예: 3단계 완료 -> (3/3) * 100 = 100%
	return { step, progress };
}

export function useStepMapAtomHook() {
	const step = useAtomValue(stepAtom);
	const [currentStepData, setCurrentStepData] = useAtom(currentStepDataAtom);
	const [stepMap, setStepMap] = useAtom(stepMapAtom);

	// 현재 step의 데이터를 삭제
	const deleteCurrentStepData = useCallback(() => {
		setStepMap((prev) => {
			const newMap = new Map(prev);
			newMap.delete(step); // 현재 step에 해당하는 데이터 삭제
			return newMap; // 업데이트된 Map 반환
		});
	}, [setStepMap, step]);

	return {
		currentStepData,
		setCurrentStepData,
		stepMap,
		deleteCurrentStepData,
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

	return { resetStep };
}
