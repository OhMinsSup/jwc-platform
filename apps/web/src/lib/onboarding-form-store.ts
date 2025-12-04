import type {
	Department,
	Gender,
	StayType,
	TfTeam,
	TshirtSize,
} from "@jwc/schema";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Re-export types from schema
export type { Department, Gender, StayType, TfTeam, TshirtSize };

// ============================================================
// 스텝 URL 경로 정의
// ============================================================

export const STEPS = [
	"welcome",
	"personal-info",
	"attendance-info",
	"support-info",
	"additional-info",
	"payment-info",
	"confirm",
	"completed",
] as const;

export type StepSlug = (typeof STEPS)[number];

export const STEP_CONFIG: Record<Uppercase<StepSlug> | "TOTAL_STEPS", number> =
	{
		WELCOME: 0,
		"PERSONAL-INFO": 1,
		"ATTENDANCE-INFO": 2,
		"SUPPORT-INFO": 3,
		"ADDITIONAL-INFO": 4,
		"PAYMENT-INFO": 5,
		CONFIRM: 6,
		COMPLETED: 7,
		TOTAL_STEPS: 7,
	} as const;

export const STEP_LABELS: Record<StepSlug, string> = {
	welcome: "시작",
	"personal-info": "기본 정보",
	"attendance-info": "참석 정보",
	"support-info": "봉사 지원",
	"additional-info": "추가 정보",
	"payment-info": "회비 안내",
	confirm: "확인",
	completed: "완료",
} as const;

// 스텝 인덱스 <-> 슬러그 변환 헬퍼
export const getStepIndex = (slug: StepSlug): number => STEPS.indexOf(slug);
export const getStepSlug = (index: number): StepSlug =>
	STEPS[index] ?? "welcome";
export const isValidStep = (slug: string): slug is StepSlug =>
	STEPS.includes(slug as StepSlug);

// 다음/이전 스텝 슬러그 가져오기
export const getNextStep = (currentSlug: StepSlug): StepSlug | null => {
	const currentIndex = getStepIndex(currentSlug);
	return currentIndex < STEPS.length - 1 ? STEPS[currentIndex + 1] : null;
};

export const getPrevStep = (currentSlug: StepSlug): StepSlug | null => {
	const currentIndex = getStepIndex(currentSlug);
	return currentIndex > 0 ? STEPS[currentIndex - 1] : null;
};

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
	// 폼 데이터
	formData: OnboardingFormData;

	// 액션
	updateFormData: (data: Partial<OnboardingFormData>) => void;
	resetForm: () => void;

	// 유효성 검사 (URL 기반이므로 스텝 슬러그로 검사)
	isStepValid: (step: StepSlug) => boolean;
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
			formData: initialFormData,

			updateFormData: (data) => {
				set((state) => ({
					formData: { ...state.formData, ...data },
				}));
			},

			resetForm: () => {
				set({ formData: initialFormData });
			},

			isStepValid: (step: StepSlug) => {
				const { formData } = get();

				switch (step) {
					case "personal-info":
						return !!(
							formData.name &&
							formData.phone &&
							formData.gender &&
							formData.department &&
							formData.ageGroup
						);
					case "attendance-info":
						return !!formData.stayType;
					case "support-info":
						return true; // Optional fields
					case "additional-info":
						return !!formData.tshirtSize;
					case "payment-info":
						return true; // Info only step
					case "confirm":
						return true;
					default:
						return true;
				}
			},
		}),
		{
			name: "onboarding-form-storage",
			partialize: (state) => ({
				formData: state.formData,
			}),
		}
	)
);
