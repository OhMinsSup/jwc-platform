import type {
	Department,
	Gender,
	StayType,
	TfTeam,
	TshirtSize,
} from "@jwc/schema";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

// Re-export types from schema
export type { Department, Gender, StayType, TfTeam, TshirtSize };

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

/** 스텝 슬러그를 인덱스로 변환 */
export const getStepIndex = (slug: StepSlug): number => STEPS.indexOf(slug);

/** 인덱스를 스텝 슬러그로 변환 */
export const getStepSlug = (index: number): StepSlug =>
	STEPS[index] ?? "welcome";

/** 유효한 스텝인지 확인 */
export const isValidStep = (slug: string): slug is StepSlug =>
	STEPS.includes(slug as StepSlug);

/** 다음 스텝 슬러그 가져오기 */
export const getNextStep = (currentSlug: StepSlug): StepSlug | null => {
	const currentIndex = getStepIndex(currentSlug);
	return currentIndex < STEPS.length - 1
		? (STEPS[currentIndex + 1] ?? null)
		: null;
};

/** 이전 스텝 슬러그 가져오기 */
export const getPrevStep = (currentSlug: StepSlug): StepSlug | null => {
	const currentIndex = getStepIndex(currentSlug);
	return currentIndex > 0 ? (STEPS[currentIndex - 1] ?? null) : null;
};

/** 개인 정보 (Step 1) */
interface PersonalInfo {
	name: string;
	phone: string;
	gender: Gender | null;
	department: Department | null;
	ageGroup: string;
}

/** 참석 정보 (Step 2) */
interface AttendanceInfo {
	stayType: StayType | null;
	attendanceDate?: string;
	pickupTimeDescription?: string;
}

/** 봉사 및 지원 정보 (Step 3) */
interface SupportInfo {
	tfTeam?: TfTeam;
	canProvideRide?: boolean;
	rideDetails?: string;
}

/** 추가 정보 (Step 4) */
interface AdditionalInfo {
	tshirtSize: TshirtSize | null;
}

/** 회비 정보 (Step 5) */
interface PaymentInfo {
	isPaid: boolean;
}

/** 전체 폼 데이터 */
export interface OnboardingFormData
	extends PersonalInfo,
		AttendanceInfo,
		SupportInfo,
		AdditionalInfo,
		PaymentInfo {}

interface FormDataSlice {
	formData: OnboardingFormData;
}

interface FormActionsSlice {
	/** 폼 데이터 부분 업데이트 */
	updateFormData: (data: Partial<OnboardingFormData>) => void;
	/** 폼 데이터 전체 교체 (Draft 로드 시) */
	setFormData: (data: Partial<OnboardingFormData>) => void;
	/** 폼 초기화 */
	resetForm: () => void;
}

interface ValidationSlice {
	/** 스텝별 유효성 검사 */
	isStepValid: (step: StepSlug) => boolean;
	/** 전체 폼 유효성 검사 */
	isFormComplete: () => boolean;
}

export interface OnboardingFormStore
	extends FormDataSlice,
		FormActionsSlice,
		ValidationSlice {}

const initialPersonalInfo: PersonalInfo = {
	name: "",
	phone: "",
	gender: null,
	department: null,
	ageGroup: "",
};

const initialAttendanceInfo: AttendanceInfo = {
	stayType: null,
	attendanceDate: undefined,
	pickupTimeDescription: undefined,
};

const initialSupportInfo: SupportInfo = {
	tfTeam: undefined,
	canProvideRide: undefined,
	rideDetails: undefined,
};

const initialAdditionalInfo: AdditionalInfo = {
	tshirtSize: null,
};

const initialPaymentInfo: PaymentInfo = {
	isPaid: false,
};

const initialFormData: OnboardingFormData = {
	...initialPersonalInfo,
	...initialAttendanceInfo,
	...initialSupportInfo,
	...initialAdditionalInfo,
	...initialPaymentInfo,
};

/** 개인정보 스텝 유효성 검사 */
function validatePersonalInfo(data: OnboardingFormData): boolean {
	return !!(
		data.name &&
		data.phone &&
		data.gender &&
		data.department &&
		data.ageGroup
	);
}

/** 참석정보 스텝 유효성 검사 */
function validateAttendanceInfo(data: OnboardingFormData): boolean {
	return !!data.stayType;
}

/** 추가정보 스텝 유효성 검사 */
function validateAdditionalInfo(data: OnboardingFormData): boolean {
	return !!data.tshirtSize;
}

/** 스텝별 유효성 검사 */
function validateStep(step: StepSlug, data: OnboardingFormData): boolean {
	switch (step) {
		case "personal-info":
			return validatePersonalInfo(data);
		case "attendance-info":
			return validateAttendanceInfo(data);
		case "support-info":
			return true; // 선택 필드만 있음
		case "additional-info":
			return validateAdditionalInfo(data);
		case "payment-info":
			return true; // 정보 표시만
		case "confirm":
			return true;
		default:
			return true;
	}
}

/** 전체 폼 유효성 검사 */
function validateFormComplete(data: OnboardingFormData): boolean {
	return (
		validatePersonalInfo(data) &&
		validateAttendanceInfo(data) &&
		validateAdditionalInfo(data)
	);
}

export const useOnboardingFormStore = create<OnboardingFormStore>()(
	devtools(
		(set, get) => ({
			// State
			formData: initialFormData,

			// Actions
			updateFormData: (data) => {
				set(
					(state) => ({
						formData: { ...state.formData, ...data },
					}),
					undefined,
					"formData/update"
				);
			},

			setFormData: (data) => {
				set(
					{ formData: { ...initialFormData, ...data } },
					undefined,
					"formData/set"
				);
			},

			resetForm: () => {
				set({ formData: initialFormData }, undefined, "formData/reset");
			},

			// Validation
			isStepValid: (step) => validateStep(step, get().formData),
			isFormComplete: () => validateFormComplete(get().formData),
		}),
		{
			name: "OnboardingFormStore",
			enabled: process.env.NODE_ENV === "development",
		}
	)
);

/** 개인정보만 선택 */
export const usePersonalInfo = () =>
	useOnboardingFormStore((state) => ({
		name: state.formData.name,
		phone: state.formData.phone,
		gender: state.formData.gender,
		department: state.formData.department,
		ageGroup: state.formData.ageGroup,
	}));

/** 참석정보만 선택 */
export const useAttendanceInfo = () =>
	useOnboardingFormStore((state) => ({
		stayType: state.formData.stayType,
		attendanceDate: state.formData.attendanceDate,
		pickupTimeDescription: state.formData.pickupTimeDescription,
	}));

/** 봉사정보만 선택 */
export const useSupportInfo = () =>
	useOnboardingFormStore((state) => ({
		tfTeam: state.formData.tfTeam,
		canProvideRide: state.formData.canProvideRide,
		rideDetails: state.formData.rideDetails,
	}));

/** 추가정보만 선택 */
export const useAdditionalInfo = () =>
	useOnboardingFormStore((state) => ({
		tshirtSize: state.formData.tshirtSize,
	}));

/** 액션만 선택 (리렌더링 최소화) */
export const useFormActions = () =>
	useOnboardingFormStore((state) => ({
		updateFormData: state.updateFormData,
		setFormData: state.setFormData,
		resetForm: state.resetForm,
	}));
