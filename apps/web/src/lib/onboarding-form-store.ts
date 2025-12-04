import { create } from "zustand";
import { persist } from "zustand/middleware";

// ============================================================
// 타입 정의 (Convex 스키마와 일치)
// ============================================================

export type Gender = "male" | "female";
export type Department = "youth1" | "youth2" | "other";
export type StayType =
	| "3nights4days"
	| "2nights3days"
	| "1night2days"
	| "dayTrip";
export type TfTeam = "none" | "praise" | "program" | "media";
export type TshirtSize = "s" | "m" | "l" | "xl" | "2xl" | "3xl";

// ============================================================
// 스텝 설정 (먼저 정의)
// ============================================================

export const STEP_CONFIG = {
	WELCOME: 0,
	PERSONAL_INFO: 1,
	ATTENDANCE_INFO: 2,
	SUPPORT_INFO: 3,
	ADDITIONAL_INFO: 4,
	PAYMENT_INFO: 5,
	CONFIRM: 6,
	COMPLETED: 7,
	TOTAL_STEPS: 7,
} as const;

export const STEP_LABELS = [
	"시작",
	"기본 정보",
	"참석 정보",
	"봉사 지원",
	"추가 정보",
	"회비 안내",
	"확인",
	"완료",
] as const;

// ============================================================
// 폼 데이터 인터페이스
// ============================================================

export interface OnboardingFormData {
	// Step 1: 기본 정보
	name: string;
	phone: string;
	gender: Gender | null;
	department: Department | null;
	ageGroup: string;

	// Step 2: 참석 정보
	stayType: StayType | null;
	attendanceDate?: string;
	pickupTimeDescription?: string;

	// Step 3: 봉사 및 지원 정보
	tfTeam?: TfTeam;
	canProvideRide?: boolean;
	rideDetails?: string;

	// Step 4: 기타 정보
	tshirtSize: TshirtSize | null;

	// Step 5: 회비 정보 (관리자가 관리)
	isPaid: boolean;
}

export interface OnboardingFormStore {
	// 현재 스텝
	currentStep: number;
	totalSteps: number;

	// 폼 데이터
	formData: OnboardingFormData;

	// 액션
	setStep: (step: number) => void;
	nextStep: () => void;
	prevStep: () => void;
	updateFormData: (data: Partial<OnboardingFormData>) => void;
	resetForm: () => void;

	// 유효성 검사
	isStepValid: (step: number) => boolean;
}

// ============================================================
// 초기값
// ============================================================

const initialFormData: OnboardingFormData = {
	// Step 1
	name: "",
	phone: "",
	gender: null,
	department: null,
	ageGroup: "",

	// Step 2
	stayType: null,
	attendanceDate: undefined,
	pickupTimeDescription: undefined,

	// Step 3
	tfTeam: undefined,
	canProvideRide: undefined,
	rideDetails: undefined,

	// Step 4
	tshirtSize: null,

	// Step 5
	isPaid: false,
};

// ============================================================
// 스토어 생성
// ============================================================

export const useOnboardingFormStore = create<OnboardingFormStore>()(
	persist(
		(set, get) => ({
			currentStep: 0,
			totalSteps: STEP_CONFIG.TOTAL_STEPS,

			formData: initialFormData,

			setStep: (step) => {
				const { totalSteps } = get();
				if (step >= 0 && step <= totalSteps) {
					set({ currentStep: step });
				}
			},

			nextStep: () => {
				const { currentStep, totalSteps } = get();
				if (currentStep < totalSteps) {
					set({ currentStep: currentStep + 1 });
				}
			},

			prevStep: () => {
				const { currentStep } = get();
				if (currentStep > 0) {
					set({ currentStep: currentStep - 1 });
				}
			},

			updateFormData: (data) => {
				set((state) => ({
					formData: { ...state.formData, ...data },
				}));
			},

			resetForm: () => {
				set({
					currentStep: 0,
					formData: initialFormData,
				});
			},

			isStepValid: (step) => {
				const { formData } = get();

				switch (step) {
					case STEP_CONFIG.PERSONAL_INFO:
						return !!(
							formData.name &&
							formData.phone &&
							formData.gender &&
							formData.department &&
							formData.ageGroup
						);
					case STEP_CONFIG.ATTENDANCE_INFO:
						return !!formData.stayType;
					case STEP_CONFIG.SUPPORT_INFO:
						return true; // Optional fields
					case STEP_CONFIG.ADDITIONAL_INFO:
						return !!formData.tshirtSize;
					case STEP_CONFIG.PAYMENT_INFO:
						return true; // Info only step
					case STEP_CONFIG.CONFIRM:
						return true;
					default:
						return true;
				}
			},
		}),
		{
			name: "onboarding-form-storage",
			partialize: (state) => ({
				currentStep: state.currentStep,
				formData: state.formData,
			}),
		}
	)
);
