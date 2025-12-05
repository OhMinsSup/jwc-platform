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

// ============================================================
// Steps 설정
// ============================================================

export const STEPS = [
	"welcome",
	"personal",
	"attendance",
	"support",
	"additional",
	"confirm",
	"complete",
] as const;

export type StepSlug = (typeof STEPS)[number];

export const STEP_LABELS: Record<StepSlug, string> = {
	welcome: "시작",
	personal: "기본 정보",
	attendance: "참석 정보",
	support: "봉사 지원",
	additional: "추가 정보",
	confirm: "확인",
	complete: "완료",
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

// ============================================================
// 각 스텝별 데이터 타입
// ============================================================

/** 개인 정보 (Step 1) */
export interface PersonalInfo {
	name: string;
	phone: string;
	gender: Gender | null;
	department: Department | null;
	ageGroup: string;
}

/** 참석 정보 (Step 2) */
export interface AttendanceInfo {
	stayType: StayType | null;
	pickupTimeDescription?: string;
}

/** 봉사 및 지원 정보 (Step 3) */
export interface SupportInfo {
	tfTeam?: TfTeam;
	canProvideRide?: boolean;
	rideDetails?: string;
}

/** 추가 정보 (Step 4) */
export interface AdditionalInfo {
	tshirtSize: TshirtSize | null;
}

// ============================================================
// Store 타입 정의
// ============================================================

interface OnboardingFormState {
	// 현재 스텝
	currentStep: StepSlug;

	// 각 스텝별 데이터
	personalInfo: PersonalInfo;
	attendanceInfo: AttendanceInfo;
	supportInfo: SupportInfo;
	additionalInfo: AdditionalInfo;

	// UI 상태
	isLoading: boolean;
}

interface OnboardingFormActions {
	// 스텝 이동
	setCurrentStep: (step: StepSlug) => void;

	// 각 스텝 데이터 설정
	setPersonalInfo: (data: Partial<PersonalInfo>) => void;
	setAttendanceInfo: (data: Partial<AttendanceInfo>) => void;
	setSupportInfo: (data: Partial<SupportInfo>) => void;
	setAdditionalInfo: (data: Partial<AdditionalInfo>) => void;

	// UI 상태
	setIsLoading: (loading: boolean) => void;

	// 전체 폼 데이터 (Draft 용)
	setFormData: (data: {
		personalInfo?: Partial<PersonalInfo>;
		attendanceInfo?: Partial<AttendanceInfo>;
		supportInfo?: Partial<SupportInfo>;
		additionalInfo?: Partial<AdditionalInfo>;
	}) => void;

	// 폼 초기화
	clearForm: () => void;

	// 유효성 검사
	isStepValid: (step: StepSlug) => boolean;
	isFormComplete: () => boolean;
}

export interface OnboardingFormStore
	extends OnboardingFormState,
		OnboardingFormActions {}

// ============================================================
// 초기값
// ============================================================

const initialPersonalInfo: PersonalInfo = {
	name: "",
	phone: "",
	gender: null,
	department: null,
	ageGroup: "",
};

const initialAttendanceInfo: AttendanceInfo = {
	stayType: null,
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

// ============================================================
// 유효성 검사 함수
// ============================================================

function validatePersonalInfo(data: PersonalInfo): boolean {
	return !!(
		data.name &&
		data.phone &&
		data.gender &&
		data.department &&
		data.ageGroup
	);
}

function validateAttendanceInfo(data: AttendanceInfo): boolean {
	return !!data.stayType;
}

function validateAdditionalInfo(data: AdditionalInfo): boolean {
	return !!data.tshirtSize;
}

function validateStep(step: StepSlug, state: OnboardingFormState): boolean {
	switch (step) {
		case "personal":
			return validatePersonalInfo(state.personalInfo);
		case "attendance":
			return validateAttendanceInfo(state.attendanceInfo);
		case "support":
			return true; // 선택 필드만 있음
		case "additional":
			return validateAdditionalInfo(state.additionalInfo);
		case "confirm":
			return true;
		default:
			return true;
	}
}

function validateFormComplete(state: OnboardingFormState): boolean {
	return (
		validatePersonalInfo(state.personalInfo) &&
		validateAttendanceInfo(state.attendanceInfo) &&
		validateAdditionalInfo(state.additionalInfo)
	);
}

// ============================================================
// Store 생성
// ============================================================

export const useOnboardingFormStore = create<OnboardingFormStore>()(
	devtools(
		(set, get) => ({
			// State
			currentStep: "welcome",
			personalInfo: initialPersonalInfo,
			attendanceInfo: initialAttendanceInfo,
			supportInfo: initialSupportInfo,
			additionalInfo: initialAdditionalInfo,
			isLoading: false,

			// Actions
			setCurrentStep: (step) => {
				set({ currentStep: step }, undefined, "step/set");
			},

			setPersonalInfo: (data) => {
				set(
					(state) => ({
						personalInfo: { ...state.personalInfo, ...data },
					}),
					undefined,
					"personalInfo/update"
				);
			},

			setAttendanceInfo: (data) => {
				set(
					(state) => ({
						attendanceInfo: { ...state.attendanceInfo, ...data },
					}),
					undefined,
					"attendanceInfo/update"
				);
			},

			setSupportInfo: (data) => {
				set(
					(state) => ({
						supportInfo: { ...state.supportInfo, ...data },
					}),
					undefined,
					"supportInfo/update"
				);
			},

			setAdditionalInfo: (data) => {
				set(
					(state) => ({
						additionalInfo: { ...state.additionalInfo, ...data },
					}),
					undefined,
					"additionalInfo/update"
				);
			},

			setIsLoading: (loading) => {
				set({ isLoading: loading }, undefined, "loading/set");
			},

			setFormData: (data) => {
				set(
					(state) => ({
						personalInfo: data.personalInfo
							? { ...state.personalInfo, ...data.personalInfo }
							: state.personalInfo,
						attendanceInfo: data.attendanceInfo
							? { ...state.attendanceInfo, ...data.attendanceInfo }
							: state.attendanceInfo,
						supportInfo: data.supportInfo
							? { ...state.supportInfo, ...data.supportInfo }
							: state.supportInfo,
						additionalInfo: data.additionalInfo
							? { ...state.additionalInfo, ...data.additionalInfo }
							: state.additionalInfo,
					}),
					undefined,
					"formData/set"
				);
			},

			clearForm: () => {
				set(
					{
						currentStep: "welcome",
						personalInfo: initialPersonalInfo,
						attendanceInfo: initialAttendanceInfo,
						supportInfo: initialSupportInfo,
						additionalInfo: initialAdditionalInfo,
						isLoading: false,
					},
					undefined,
					"form/clear"
				);
			},

			// Validation
			isStepValid: (step) => validateStep(step, get()),
			isFormComplete: () => validateFormComplete(get()),
		}),
		{
			name: "OnboardingFormStore",
			enabled: process.env.NODE_ENV === "development",
		}
	)
);

// ============================================================
// Selector hooks (성능 최적화)
// ============================================================

/** 개인정보만 선택 */
export const usePersonalInfo = () =>
	useOnboardingFormStore((state) => state.personalInfo);

/** 참석정보만 선택 */
export const useAttendanceInfo = () =>
	useOnboardingFormStore((state) => state.attendanceInfo);

/** 봉사정보만 선택 */
export const useSupportInfo = () =>
	useOnboardingFormStore((state) => state.supportInfo);

/** 추가정보만 선택 */
export const useAdditionalInfo = () =>
	useOnboardingFormStore((state) => state.additionalInfo);

/** 현재 스텝만 선택 */
export const useCurrentStep = () =>
	useOnboardingFormStore((state) => state.currentStep);

/** 로딩 상태만 선택 */
export const useIsLoading = () =>
	useOnboardingFormStore((state) => state.isLoading);
