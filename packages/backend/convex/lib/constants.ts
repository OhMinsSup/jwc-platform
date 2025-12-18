/**
 * 공통 상수 정의
 *
 * 백엔드에서 사용하는 레이블 및 상수 값들
 */

/** 숙박 형태 레이블 */
export const STAY_TYPE_LABELS: Record<string, string> = {
	"3nights4days": "3박4일 (전체 참석)",
	"2nights3days": "2박3일",
	"1night2days": "1박2일",
	dayTrip: "무박 (당일치기)",
};

/** 부서 레이블 */
export const DEPARTMENT_LABELS: Record<string, string> = {
	youth1: "청년1부",
	youth2: "청년2부",
	other: "기타",
};

/** 성별 레이블 */
export const GENDER_LABELS: Record<string, string> = {
	male: "남성",
	female: "여성",
};

/** TF팀 레이블 */
export const TF_TEAM_LABELS: Record<string, string> = {
	none: "없음",
	praise: "찬양팀",
	program: "프로그램팀",
	media: "미디어팀",
};

/** 티셔츠 사이즈 레이블 */
export const TSHIRT_SIZE_LABELS: Record<string, string> = {
	s: "S",
	m: "M",
	l: "L",
	xl: "XL",
	"2xl": "2XL",
	"3xl": "3XL",
};

/** 회비 정보 (원) */
export const FEES: Record<string, number> = {
	"3nights4days": 60_000,
	"2nights3days": 50_000,
	"1night2days": 45_000,
	dayTrip: 45_000,
};
