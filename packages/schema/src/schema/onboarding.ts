import { AsYouType } from "libphonenumber-js";
import { z } from "zod/v4";

export const AGE_GROUP_REGEX = /^[0-9]{2}또래$/;

// ============================================================
// 타입 정의 (Convex 스키마와 일치)
// ============================================================

export const GenderEnum = z.enum(["male", "female"]);
export const DepartmentEnum = z.enum(["youth1", "youth2", "other"]);
export const StayTypeEnum = z.enum([
	"3nights4days",
	"2nights3days",
	"1night2days",
	"dayTrip",
]);
export const TfTeamEnum = z.enum(["none", "praise", "program", "media"]);
export const TshirtSizeEnum = z.enum(["s", "m", "l", "xl", "2xl", "3xl"]);

export type Gender = z.infer<typeof GenderEnum>;
export type Department = z.infer<typeof DepartmentEnum>;
export type StayType = z.infer<typeof StayTypeEnum>;
export type TfTeam = z.infer<typeof TfTeamEnum>;
export type TshirtSize = z.infer<typeof TshirtSizeEnum>;

// ============================================================
// 라벨 매핑 (UI 표시용)
// ============================================================

export const GENDER_LABELS: Record<Gender, string> = {
	male: "남성",
	female: "여성",
};

export const DEPARTMENT_LABELS: Record<Department, string> = {
	youth1: "청년1부",
	youth2: "청년2부",
	other: "기타",
};

export const STAY_TYPE_LABELS: Record<StayType, string> = {
	"3nights4days": "3박4일",
	"2nights3days": "2박3일",
	"1night2days": "1박2일",
	dayTrip: "무박",
};

export const TF_TEAM_LABELS: Record<TfTeam, string> = {
	none: "없음",
	praise: "찬양팀",
	program: "프로그램팀",
	media: "미디어팀",
};

export const TSHIRT_SIZE_LABELS: Record<TshirtSize, string> = {
	s: "S",
	m: "M",
	l: "L",
	xl: "XL",
	"2xl": "2XL",
	"3xl": "3XL",
};

// ============================================================
// 폼 스키마
// ============================================================

export const OnboardingFormSchema = z.object({
	name: z
		.string()
		.min(1, "이름을 입력해주세요.")
		.max(10, "이름은 10자 이내로 입력해주세요.")
		.transform((value) => value.trim()),
	phone: z
		.string()
		.min(9, "유효한 전화번호를 입력해주세요.")
		.max(11, "유효한 전화번호를 입력해주세요.")
		.transform((value) => value.trim())
		.refine((value) => {
			const asYouType = new AsYouType("KR");
			asYouType.input(value);
			const number = asYouType.getNumber();
			return number?.isValid() ?? false;
		}, "유효한 전화번호를 입력해주세요."),
	gender: GenderEnum.describe("성별을 선택해주세요."),
	department: DepartmentEnum.describe("소속을 선택해주세요."),
	ageGroup: z
		.string()
		.min(1, "또래를 적어주세요.")
		.transform((value) => value.trim())
		.refine((value) => AGE_GROUP_REGEX.test(value), {
			message: "또래를 숫자 2자리로 입력해주세요. (예시: 00또래)",
		}),
	stayType: StayTypeEnum.describe("참석 유형을 선택해주세요."),
	attendanceDate: z
		.union([z.iso.datetime(), z.date(), z.instanceof(Date)])
		.optional()
		.transform((val) => (val instanceof Date ? val.toISOString() : val)),
	pickupTimeDescription: z
		.string()
		.max(500, { message: "픽업 시간 내용을 500자 이내로 입력해주세요." })
		.optional(),
	isPaid: z.boolean().default(false),
	tfTeam: TfTeamEnum.optional(),
	canProvideRide: z.boolean().default(false),
	rideDetails: z
		.string()
		.max(500, { message: "차량 지원 내용을 500자 이내로 입력해주세요." })
		.optional(),
	tshirtSize: TshirtSizeEnum.optional(),
});

export type OnboardingForm = z.infer<typeof OnboardingFormSchema>;

// 이전 버전과의 호환성을 위해 유지
export const FormSchema = OnboardingFormSchema;
export type Form = OnboardingForm;
