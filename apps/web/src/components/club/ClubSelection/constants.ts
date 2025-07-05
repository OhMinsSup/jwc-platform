// 부서 옵션
export const DEPARTMENT_OPTIONS = [
	{ value: "청년1부", label: "청년 1부" },
	{ value: "청년2부", label: "청년 2부" },
	{ value: "기타", label: "기타" },
] as const;

// 폼 플레이스홀더
export const FORM_PLACEHOLDERS = {
	name: "이름을 입력해주세요",
	phone: "연락처를 입력해주세요",
	department: "부서를 선택해주세요",
	ageGroup: "또래를 입력해주세요 (예: 93또래)",
	component: "선택해주세요",
	description: "내용을 입력해주세요...",
} as const;

// 에러 메시지
export const ERROR_MESSAGES = {
	name: "이름을 입력해주세요",
	phone: "연락처를 입력해주세요",
	department: "부서를 선택해주세요",
	ageGroup: "또래를 입력해주세요",
	submit: "신청 제출에 실패했습니다.",
	clubNotFound: "동아리 정보를 불러올 수 없습니다.",
} as const;

// 성공 메시지
export const SUCCESS_MESSAGE = "신청이 성공적으로 제출되었습니다." as const;
