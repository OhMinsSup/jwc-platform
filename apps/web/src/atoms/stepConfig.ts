import type React from "react";

// LazyComponentProps 타입 정의
export interface LazyComponentProps {
	idx: number;
	componentKey: string;
}

// Step 정의를 위한 타입
export interface StepDefinition {
	readonly key: string;
	readonly name: string;
	readonly component: () => Promise<{
		default: React.ComponentType<LazyComponentProps>;
	}>;
	readonly metadata?: {
		readonly title?: string;
		readonly description?: string;
		readonly validation?: string[];
	};
}

// Step 정의 배열 - 이 배열에서 모든 step 정보가 자동으로 계산됩니다
export const STEP_DEFINITIONS: readonly StepDefinition[] = [
	{
		key: "name",
		name: "FormName",
		component: () =>
			import("~/components/retreat/FormName").then((m) => ({
				default: m.FormName,
			})),
		metadata: {
			title: "이름 입력",
			description: "참가자의 이름을 입력하세요",
		},
	},
	{
		key: "phone",
		name: "FormPhone",
		component: () =>
			import("~/components/retreat/FormPhone").then((m) => ({
				default: m.FormPhone,
			})),
		metadata: {
			title: "연락처 입력",
			description: "연락 가능한 전화번호를 입력하세요",
		},
	},
	{
		key: "gender",
		name: "FormGender",
		component: () =>
			import("~/components/retreat/FormGender").then((m) => ({
				default: m.FormGender,
			})),
		metadata: {
			title: "성별 선택",
			description: "성별을 선택하세요",
		},
	},
	{
		key: "department",
		name: "FormDepartment",
		component: () =>
			import("~/components/retreat/FormDepartment").then((m) => ({
				default: m.FormDepartment,
			})),
		metadata: {
			title: "부서 선택",
			description: "소속 부서를 선택하세요",
		},
	},
	{
		key: "ageGroup",
		name: "FormAgeGroup",
		component: () =>
			import("~/components/retreat/FormAgeGroup").then((m) => ({
				default: m.FormAgeGroup,
			})),
		metadata: {
			title: "연령대 선택",
			description: "해당하는 연령대를 선택하세요",
		},
	},
	{
		key: "tshirtSize",
		name: "FormTshirtSize",
		component: () =>
			import("~/components/retreat/FormTshirtSize").then((m) => ({
				default: m.FormTshirtSize,
			})),
		metadata: {
			title: "티셔츠 사이즈",
			description: "티셔츠 사이즈를 선택하세요",
		},
	},
	{
		key: "tfTeam",
		name: "FormTFTeam",
		component: () =>
			import("~/components/retreat/FormTFTeam").then((m) => ({
				default: m.FormTFTeam,
			})),
		metadata: {
			title: "TF팀 선택",
			description: "참여하실 TF팀을 선택하세요",
		},
	},
	{
		key: "numberOfStays",
		name: "FormNumberOfStays",
		component: () =>
			import("~/components/retreat/FormNumberOfStays").then((m) => ({
				default: m.FormNumberOfStays,
			})),
		metadata: {
			title: "숙박 기간",
			description: "수련회 참여 기간을 선택하세요",
		},
	},
	{
		key: "attendanceTime",
		name: "FormAttendanceTime",
		component: () =>
			import("~/components/retreat/FormAttendanceTime").then((m) => ({
				default: m.FormAttendanceTime,
			})),
		metadata: {
			title: "참석 시간",
			description: "참석 가능한 시간을 선택하세요",
		},
	},
	{
		key: "pickup",
		name: "FormPickupDescription",
		component: () =>
			import("~/components/retreat/FormPickupDescription").then((m) => ({
				default: m.FormPickupDescription,
			})),
		metadata: {
			title: "픽업 정보",
			description: "픽업 관련 정보를 입력하세요",
		},
	},
	{
		key: "carSupport",
		name: "FormCarSupport",
		component: () =>
			import("~/components/retreat/FormCarSupport").then((m) => ({
				default: m.FormCarSupport,
			})),
		metadata: {
			title: "차량 지원",
			description: "차량 지원 여부를 선택하세요",
		},
	},
	{
		key: "carSupportContent",
		name: "FormCarSupportContent",
		component: () =>
			import("~/components/retreat/FormCarSupportContent").then((m) => ({
				default: m.FormCarSupportContent,
			})),
		metadata: {
			title: "차량 지원 내용",
			description: "차량 지원 관련 상세 내용을 입력하세요",
		},
	},
	{
		key: "paid",
		name: "FormPaid",
		component: () =>
			import("~/components/retreat/FormPaid").then((m) => ({
				default: m.FormPaid,
			})),
		metadata: {
			title: "결제 정보",
			description: "참가비 결제 정보를 입력하세요",
		},
	},
] as const;

// 자동으로 계산되는 설정값들
export const STEP_CONFIG = {
	TOTAL_COUNT: STEP_DEFINITIONS.length,
	CONFIRM_STEP: STEP_DEFINITIONS.length + 1,
	COMPLETED_STEP: STEP_DEFINITIONS.length + 2,
	FIRST_STEP: 1,
	WELCOME_STEP: 0,
	STEPS_BY_KEY: Object.fromEntries(
		STEP_DEFINITIONS.map((step, index) => [step.key, index + 1])
	),
	STEPS_BY_INDEX: Object.fromEntries(
		STEP_DEFINITIONS.map((step, index) => [index + 1, step])
	),
} as const;

// 타입 안전성을 위한 타입 추출
export type StepKey = (typeof STEP_DEFINITIONS)[number]["key"];
export type StepIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

// 헬퍼 함수들
export const getStepByKey = (key: StepKey): StepDefinition | undefined => {
	return STEP_DEFINITIONS.find((step) => step.key === key);
};

export const getStepByIndex = (index: number): StepDefinition | undefined => {
	return STEP_DEFINITIONS[index - 1];
};

export const getStepIndex = (key: StepKey): number => {
	return STEP_CONFIG.STEPS_BY_KEY[key] || 0;
};

export const isValidStep = (step: number): boolean => {
	return step >= STEP_CONFIG.WELCOME_STEP && step <= STEP_CONFIG.COMPLETED_STEP;
};

export const isFormStep = (step: number): boolean => {
	return step >= STEP_CONFIG.FIRST_STEP && step <= STEP_CONFIG.TOTAL_COUNT;
};
