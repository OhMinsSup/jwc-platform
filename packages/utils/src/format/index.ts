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
