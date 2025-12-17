// 정규식 미리 컴파일 (성능 최적화)
const KOREAN_DATE_REGEX = /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/;
const DATE_SEPARATOR_REGEX = /(\d{4})[.|/|-](\d{1,2})[.|/|-](\d{1,2})/;

const KOREAN_AMPM_TIME_REGEX = /(오전|오후)\s*(\d{1,2})시(?:\s*(\d{1,2})분)?/;
const KOREAN_24H_TIME_REGEX = /(\d{1,2})시\s*(\d{1,2})분/;
const TIME_HHMM_REGEX = /(\d{1,2}):(\d{1,2})/;

/**
 * 다양한 날짜 형식을 YYYY-MM-DD로 변환
 */
export function parseKoreanDate(value: string): string {
	if (!value) {
		return "";
	}
	const trimmed = value.trim();

	// 1. "YYYY년 MM월 DD일"
	let match = trimmed.match(KOREAN_DATE_REGEX);
	if (match) {
		return formatYMD(match[1], match[2], match[3]);
	}

	// 2. "YYYY.MM.DD", "YYYY/MM/DD", "YYYY-MM-DD"
	match = trimmed.match(DATE_SEPARATOR_REGEX);
	if (match) {
		return formatYMD(match[1], match[2], match[3]);
	}

	return trimmed;
}

/**
 * 다양한 시간 형식을 HH:mm으로 변환
 */
export function parseKoreanTime(value: string): string {
	if (!value) {
		return "";
	}
	const trimmed = value.trim();

	// 1. "오전/오후 h시 mm분"
	const ampmResult = parseKoreanAmPmTime(trimmed);
	if (ampmResult !== null) {
		return ampmResult;
	}

	// 2. "HH:mm"
	const hhmmResult = parseHHmmTime(trimmed);
	if (hhmmResult !== null) {
		return hhmmResult;
	}

	// 3. "HH시 mm분" (24h)
	const korean24hResult = parseKorean24hTime(trimmed);
	if (korean24hResult !== null) {
		return korean24hResult;
	}

	return trimmed;
}

function parseKoreanAmPmTime(trimmed: string): string | null {
	const match = trimmed.match(KOREAN_AMPM_TIME_REGEX);
	if (!match) {
		return null;
	}

	const meridiem = match[1];
	let hour = Number.parseInt(match[2], 10);
	const minute = match[3] ? Number.parseInt(match[3], 10) : 0;

	// 시간 유효성 검사 (1차)
	if (hour < 0 || hour > 24 || minute < 0 || minute > 59) {
		return null;
	}

	if (meridiem === "오후" && hour < 12) {
		hour += 12;
	} else if (meridiem === "오전" && hour === 12) {
		hour = 0;
	}

	if (isValidTime(hour, minute)) {
		return formatHM(hour, minute);
	}
	return null;
}

function parseHHmmTime(trimmed: string): string | null {
	const match = trimmed.match(TIME_HHMM_REGEX);
	if (!match) {
		return null;
	}

	const hour = Number.parseInt(match[1], 10);
	const minute = Number.parseInt(match[2], 10);
	if (isValidTime(hour, minute)) {
		return formatHM(hour, minute);
	}
	return null;
}

function parseKorean24hTime(trimmed: string): string | null {
	const match = trimmed.match(KOREAN_24H_TIME_REGEX);
	if (!match) {
		return null;
	}

	const hour = Number.parseInt(match[1], 10);
	const minute = Number.parseInt(match[2], 10);
	if (isValidTime(hour, minute)) {
		return formatHM(hour, minute);
	}
	return null;
}

function formatYMD(year: string, month: string, day: string): string {
	return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function formatHM(hour: number, minute: number): string {
	return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

function isValidTime(h: number, m: number): boolean {
	return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}
