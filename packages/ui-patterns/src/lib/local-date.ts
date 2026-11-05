/**
 * 타임존 없는 로컬 날짜/시각 문자열 다루기 (날짜 선택기 전용 순수 함수).
 * 값 형식은 브라우저 기본 입력과 같다: "YYYY-MM-DD", "HH:mm", "YYYY-MM-DDTHH:mm".
 * Date는 달력 표시용으로만 로컬 자정으로 만들고, 저장 값은 항상 문자열이다 (브라우저 타임존 영향 없음).
 */

const DATE_PATTERN = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/u;
const TIME_PATTERN = /^(?<hour>[01]\d|2[0-3]):(?<minute>[0-5]\d)$/u;
const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const NOON = 12;
const PAD = 2;
/** "HH:mm" 길이 (초가 붙은 값은 잘라 낸다) */
const TIME_LENGTH = 5;

const pad = (value: number) => String(value).padStart(PAD, "0");

/** "YYYY-MM-DD" → 로컬 자정 Date. 형식이 틀리거나 없는 날짜(2월 30일 등)면 undefined */
export function parseLocalDate(value: string | undefined): Date | undefined {
	const groups =
		value === undefined ? undefined : DATE_PATTERN.exec(value)?.groups;
	if (!groups) {
		return undefined;
	}
	const year = Number(groups.year);
	const month = Number(groups.month);
	const day = Number(groups.day);
	const date = new Date(year, month - 1, day);
	const sameDay =
		date.getFullYear() === year &&
		date.getMonth() === month - 1 &&
		date.getDate() === day;
	return sameDay ? date : undefined;
}

/** Date의 로컬 날짜 → "YYYY-MM-DD" */
export function toLocalDateString(date: Date): string {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 요일 한 글자 ("목") */
function weekdayOf(date: Date): string {
	return new Intl.DateTimeFormat("ko-KR", { weekday: "short" }).format(date);
}

/** 좁은 칸용 "2026.06.25 (목)" */
export function formatDateLabelShort(date: Date): string {
	return `${toLocalDateString(date).replaceAll("-", ".")} (${weekdayOf(date)})`;
}

/** "2026년 6월 25일 (목)" — 서버/브라우저가 같은 글자를 내도록 Intl 한국어 형식만 쓴다 */
export function formatDateLabel(date: Date): string {
	const text = new Intl.DateTimeFormat("ko-KR", {
		year: "numeric",
		month: "long",
		day: "numeric",
	}).format(date);
	return `${text} (${weekdayOf(date)})`;
}

/** "HH:mm" → { hour, minute }. 형식이 틀리면 undefined */
export function parseTime(
	value: string | undefined,
): { hour: number; minute: number } | undefined {
	const groups =
		value === undefined ? undefined : TIME_PATTERN.exec(value)?.groups;
	return groups
		? { hour: Number(groups.hour), minute: Number(groups.minute) }
		: undefined;
}

export function toTimeString(hour: number, minute: number): string {
	return `${pad(hour)}:${pad(minute)}`;
}

/** 0~23시 선택지. 표시는 "오전 9시"/"오후 3시" (24시간 숫자는 값으로만) */
export function hourOptions(): { value: string; label: string }[] {
	return Array.from({ length: HOURS_PER_DAY }, (_, hour) => {
		const half = hour < NOON ? "오전" : "오후";
		const shown = hour % NOON === 0 ? NOON : hour % NOON;
		return { value: String(hour), label: `${half} ${shown}시` };
	});
}

/** 간격이 1시간을 나누어떨어지면 시/분 두 선택으로 고를 수 있다 (아니면 시각 목록 하나) */
export function fitsHourGrid(stepMinutes: number): boolean {
	return stepMinutes >= 1 && MINUTES_PER_HOUR % stepMinutes === 0;
}

/** 분 선택지: 간격(step)의 배수만 (fitsHourGrid인 간격 전제) */
export function minuteOptions(
	stepMinutes: number,
): { value: string; label: string }[] {
	const step = fitsHourGrid(stepMinutes) ? stepMinutes : MINUTES_PER_HOUR;
	const minutes: number[] = [];
	for (let minute = 0; minute < MINUTES_PER_HOUR; minute += step) {
		minutes.push(minute);
	}
	return minutes.map((minute) => ({
		value: String(minute),
		label: `${pad(minute)}분`,
	}));
}

/** 자정부터 간격마다의 시각 목록 ("HH:mm"). 1시간을 나누지 않는 간격(45분 등)용 */
export function timeSlots(stepMinutes: number): string[] {
	const step = Math.max(1, stepMinutes);
	const slots: string[] = [];
	for (let total = 0; total < HOURS_PER_DAY * MINUTES_PER_HOUR; total += step) {
		slots.push(
			toTimeString(
				Math.floor(total / MINUTES_PER_HOUR),
				total % MINUTES_PER_HOUR,
			),
		);
	}
	return slots;
}

/** "YYYY-MM-DDTHH:mm" → 날짜/시각 부분 (빈 값이면 둘 다 undefined) */
export function splitDateTime(value: string | undefined): {
	date: string | undefined;
	time: string | undefined;
} {
	if (!value) {
		return { date: undefined, time: undefined };
	}
	const [date = "", time = ""] = value.split("T");
	return {
		date: date === "" ? undefined : date,
		time: time === "" ? undefined : time.slice(0, TIME_LENGTH),
	};
}

/** 날짜가 없으면 값 없음. 시각이 없으면 기본 시각을 붙인다 */
export function joinDateTime(
	date: string | undefined,
	time: string | undefined,
	defaultTime: string,
): string | undefined {
	return date ? `${date}T${time ?? defaultTime}` : undefined;
}
