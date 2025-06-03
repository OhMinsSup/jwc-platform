import type { Options } from "./types";

/**
 * 참석 날짜 옵션 목록을 반환합니다.
 *
 * @returns 참석 날짜 옵션 배열
 */
export const getAttendanceDayOptions = (): Options => {
	return [
		{
			name: "6월 19일",
			value: "19",
		},
		{
			name: "6월 20일",
			value: "20",
		},
		{
			name: "6월 21일",
			value: "21",
		},
		{
			name: "6월 22일",
			value: "22",
		},
	];
};

/**
 * 참석 시간 옵션 목록을 반환합니다.
 *
 * @returns 참석 시간 옵션 배열
 */
export const getAttendanceTimeOptions = (): Options => {
	return [
		{
			name: "오전",
			value: "AM",
			description: "오전 9시부터 12시까지",
		},
		{
			name: "오후",
			value: "PM",
			description: "오후 1시부터 6시까지",
		},
		{
			name: "저녁",
			value: "EVENING",
			description: "오후 7시부터 10시까지",
		},
	];
};

/**
 * 부서 옵션 목록을 반환합니다.
 *
 * @returns 부서 옵션 배열
 */
export const getDepartmentOptions = (): Options => {
	return [
		{
			name: "청년 1부",
			value: "청년1부",
		},
		{
			name: "청년 2부",
			value: "청년2부",
		},
		{
			name: "기타",
			value: "기타",
		},
	];
};

/**
 * 성별 옵션 목록을 반환합니다.
 *
 * @returns 성별 옵션 배열
 */
export const getGenderOptions = (): Options => {
	return [
		{
			name: "남성",
			value: "남성",
		},
		{
			name: "여성",
			value: "여성",
		},
	];
};

/**
 * 참석 형태(숙박일수) 옵션 목록을 반환합니다.
 *
 * @returns 참석 형태 옵션 배열
 */
export const getNumberOfStaysOptions = (): Options => {
	return [
		{
			name: "3박4일",
			description: "전체참여",
			value: "3박4일",
		},
		{
			name: "2박3일",
			description: "부분참여",
			value: "2박3일",
		},
		{
			name: "1박2일",
			description: "부분참여",
			value: "1박2일",
		},
		{
			name: "무박",
			description: "부분참여",
			value: "무박",
		},
	];
};

/**
 * TF팀 지원 옵션 목록을 반환합니다.
 *
 * @returns TF팀 옵션 배열
 */
export const getTfTeamOptions = (): Options => {
	return [
		{
			name: "없음",
			value: "없음",
		},
		{
			name: "찬양팀",
			value: "찬양팀",
		},
		{
			name: "프로그램팀",
			value: "프로그램팀",
		},
		{
			name: "미디어팀",
			value: "미디어팀",
		},
	];
};

/**
 * 단체티 사이즈 옵션 목록을 반환합니다.
 *
 * @returns 단체티 사이즈 옵션 배열
 */
export const getTshirtSizeOptions = (): Options => {
	return [
		{
			name: "S 사이즈",
			value: "s",
		},
		{
			name: "M 사이즈",
			value: "m",
		},
		{
			name: "L 사이즈",
			value: "l",
		},
		{
			name: "XL 사이즈",
			value: "xl",
		},
		{
			name: "XXL 사이즈",
			value: "2xl",
		},
		{
			name: "XXXL 사이즈",
			value: "3xl",
		},
	];
};
