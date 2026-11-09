/**
 * 타임존 유틸. Intl만 사용하므로 Workers/브라우저/Node 어디서나 동작하며 DST를 자동 반영한다.
 */

const PARTS_CACHE = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
	const cached = PARTS_CACHE.get(timeZone);
	if (cached) {
		return cached;
	}
	const formatter = new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hourCycle: "h23",
	});
	PARTS_CACHE.set(timeZone, formatter);
	return formatter;
}

/** epoch ms → 해당 타임존의 "YYYY-MM-DD HH:mm:ss" */
export function formatInTimeZone(epochMs: number, timeZone: string): string {
	const parts = Object.fromEntries(
		formatterFor(timeZone)
			.formatToParts(new Date(epochMs))
			.map((part) => [part.type, part.value]),
	);
	return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

/** epoch ms → 해당 타임존의 로컬 "YYYY-MM-DDTHH:mm" (closesAt 비교용) */
export function localDateTimeIn(epochMs: number, timeZone: string): string {
	const formatted = formatInTimeZone(epochMs, timeZone);
	return `${formatted.slice(0, 10)}T${formatted.slice(11, 16)}`;
}

/** 날짜 조각이 있고 0/NaN이 아닌지 (split 결과라 음수는 나오지 않는다) */
function isPositiveNumber(part: number | undefined): part is number {
	return part !== undefined && part > 0;
}

/** "YYYY-MM-DD"가 실제 존재하는 날짜인지 (2026-02-30 같은 값 거부) */
export function isRealDate(value: string): boolean {
	const [year, month, day] = value.split("-").map(Number);
	if (
		!isPositiveNumber(year) ||
		!isPositiveNumber(month) ||
		!isPositiveNumber(day)
	) {
		return false;
	}
	const date = new Date(Date.UTC(year, month - 1, day));
	return (
		date.getUTCFullYear() === year &&
		date.getUTCMonth() === month - 1 &&
		date.getUTCDate() === day
	);
}

/** "HH:mm" → 자정부터 분. 유효하지 않으면 null */
export function minutesOfDay(value: string): number | null {
	const [hour, minute] = value.split(":").map(Number);
	if (hour === undefined || minute === undefined) {
		return null;
	}
	if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
		return null;
	}
	return hour * 60 + minute;
}
