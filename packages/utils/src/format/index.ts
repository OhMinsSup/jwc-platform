/**
 * 단체티 사이즈 값을 한글 텍스트로 변환합니다.
 *
 * @param value - 단체티 사이즈 값 (예: "s", "m", "l", "xl", "2xl", "3xl")
 * @returns 변환된 한글 사이즈 문자열 (예: "S 사이즈", "XXL 사이즈" 등)
 */
export function formatTshirtSizeText(value: unknown): string {
	switch (value) {
		case "s":
			return "S 사이즈";
		case "m":
			return "M 사이즈";
		case "l":
			return "L 사이즈";
		case "xl":
			return "XL 사이즈";
		case "2xl":
			return "XXL 사이즈";
		case "3xl":
			return "XXXL 사이즈";
		default:
			return (value as string) || "";
	}
}

/**
 * 한글 텍스트로 된 단체티 사이즈 값을 영문 코드로 변환합니다.
 *
 * @param text - 한글 사이즈 문자열 (예: "S 사이즈", "XXL 사이즈" 등)
 * @returns 영문 코드 값 (예: "s", "2xl" 등), 일치하지 않으면 빈 문자열 반환
 */
export function parseTshirtSizeText(text: string): string {
	switch (text) {
		case "S 사이즈":
			return "s";
		case "M 사이즈":
			return "m";
		case "L 사이즈":
			return "l";
		case "XL 사이즈":
			return "xl";
		case "XXL 사이즈":
			return "2xl";
		case "XXXL 사이즈":
			return "3xl";
		default:
			return "";
	}
}

/**
 * 참석 날짜 값을 한글 날짜 문자열로 변환합니다.
 *
 * @param value - 참석 날짜 값 (예: "19", "20", "21", "22")
 * @returns 변환된 한글 날짜 문자열 (예: "6월 19일" 등)
 */
export function formatAttendanceDay(value: unknown): string {
	switch (value) {
		case "19":
			return "6월 19일";
		case "20":
			return "6월 20일";
		case "21":
			return "6월 21일";
		case "22":
			return "6월 22일";
		default:
			return (value as string) || "";
	}
}

/**
 * 한글 날짜 문자열을 참석 날짜 코드로 변환합니다.
 *
 * @param text - 한글 날짜 문자열 (예: "6월 19일" 등)
 * @returns 참석 날짜 코드 (예: "19", "20" 등), 일치하지 않으면 빈 문자열 반환
 */
export function parseAttendanceDay(text: string): string {
	switch (text) {
		case "6월 19일":
			return "19";
		case "6월 20일":
			return "20";
		case "6월 21일":
			return "21";
		case "6월 22일":
			return "22";
		default:
			return "";
	}
}

/**
 * 참석 시간 값을 한글 시간 문자열로 변환합니다.
 *
 * @param value - 참석 시간 값 (예: "AM", "PM", "EVENING")
 * @returns 변환된 한글 시간 문자열 (예: "오전", "오후", "저녁")
 */
export function formatAttendanceTime(value: unknown): string {
	switch (value) {
		case "AM":
			return "오전";
		case "PM":
			return "오후";
		case "EVENING":
			return "저녁";
		default:
			return (value as string) || "";
	}
}

/**
 * 한글 시간 문자열을 참석 시간 코드로 변환합니다.
 *
 * @param text - 한글 시간 문자열 (예: "오전", "오후", "저녁")
 * @returns 참석 시간 코드 (예: "AM", "PM", "EVENING"), 일치하지 않으면 빈 문자열 반환
 */
export function parseAttendanceTime(text: string): string {
	switch (text) {
		case "오전":
			return "AM";
		case "오후":
			return "PM";
		case "저녁":
			return "EVENING";
		default:
			return "";
	}
}

/**
 * 이름, 부서, 또래모임 정보를 조합하여 문자열로 반환합니다.
 *
 * @param doc - 이름, 부서, 또래모임 정보를 가진 객체 또는 문자열
 * @returns "이름 (부서 - 또래모임)" 형식의 문자열, 또는 입력이 문자열이면 그대로 반환, 값이 없으면 "미입력" 반환
 *
 * @example
 * formatName({ name: "홍길동", department: "청년1부", ageGroup: "1조" }) // "홍길동 (청년1부 - 1조)"
 * formatName("홍길동") // "홍길동"
 * formatName({}) // "미입력"
 */
export function formatName(doc: unknown): string {
	if (
		typeof doc === "object" &&
		doc !== null &&
		"name" in doc &&
		"department" in doc &&
		"ageGroup" in doc
	) {
		return `${doc?.name} (${doc?.department ?? "미입력"} - ${doc?.ageGroup ?? "미입력"})`;
	}

	return typeof doc === "string" ? doc : "미입력";
}

/**
 * "이름 (부서 - 또래모임)" 형식의 문자열에서 이름만 추출합니다.
 *
 * @param text - "이름 (부서 - 또래모임)" 형식의 문자열 또는 이름만 있는 문자열
 * @returns 이름 문자열, 형식이 맞지 않으면 원본 텍스트 반환
 */
export function parseName(text: string): string {
	const match = /^(.+?)\s*\((.+?)\s*-\s*(.+?)\)$/.exec(text);
	return match ? (match.at(1)?.trim() ?? text) : text;
}

/**
 * 전화번호를 마스킹하는 유틸리티 함수입니다.
 * @param phoneNumber - 마스킹할 전화번호
 * @returns 마스킹된 전화번호
 */
function isHyphenSeparated(phoneNumber: string) {
	return /^\d{2,3}-\d{3,4}-\d{4}$/.test(phoneNumber);
}

/**
 * 전화번호가 서울 지역번호(02)로 시작하는지 확인하는 함수입니다.
 * @param phoneNumber - 확인할 전화번호
 * @returns 서울 지역번호로 시작하면 true, 아니면 false
 */
function isSeoulPhoneNumber(phoneNumber: string) {
	return /^02\d+$/.test(phoneNumber);
}

/**
 * 특정 문자열을 "*"로 마스킹하는 함수입니다.
 * @param str - 마스킹할 문자열
 * @returns 마스킹된 문자열
 */
function maskAll(str: string) {
	return str.replace(/./g, "*");
}

/**
 * 전화번호를 마스킹하는 함수입니다.
 * @param phoneNumber - 마스킹할 전화번호
 * @returns 마스킹된 전화번호
 */
export const formatMaskPhoneNumber = (phoneNumber: string) => {
	if (isHyphenSeparated(phoneNumber)) {
		return phoneNumber.replace(
			/^(\d{2,3})-(\d{3,4})-(\d{4})$/,
			(_, p1, p2, p3) => `${p1}-${maskAll(p2)}-${p3}`
		);
	}

	if (isSeoulPhoneNumber(phoneNumber)) {
		return phoneNumber.replace(
			/^02(\d{3,4})(\d{4})/,
			(_, p1, p2) => `02${maskAll(p1)}${p2}`
		);
	}

	return phoneNumber.replace(
		/^(\d{3})(\d{3,4})(\d{4})/,
		(_, p1, p2, p3) => `${p1}${maskAll(p2)}${p3}`
	);
};
