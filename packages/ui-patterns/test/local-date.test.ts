import { describe, expect, it } from "vite-plus/test";

import {
	fitsHourGrid,
	formatDateLabel,
	formatDateLabelShort,
	hourOptions,
	joinDateTime,
	minuteOptions,
	parseLocalDate,
	parseTime,
	splitDateTime,
	timeSlots,
	toLocalDateString,
	toTimeString,
} from "../src/lib/local-date";

describe(parseLocalDate, () => {
	it("YYYY-MM-DD를 로컬 자정 Date로 바꾸고 다시 같은 문자열로 돌아온다", () => {
		const date = parseLocalDate("2026-06-25");
		expect(date?.getHours()).toBe(0);
		expect(date && toLocalDateString(date)).toBe("2026-06-25");
	});

	it("없는 날짜·잘못된 형식·빈 값은 undefined", () => {
		expect(parseLocalDate("2026-02-30")).toBeUndefined();
		expect(parseLocalDate("2026-6-5")).toBeUndefined();
		expect(parseLocalDate("")).toBeUndefined();
		expect(parseLocalDate(undefined)).toBeUndefined();
	});

	it("윤년 2월 29일은 받는다", () => {
		expect(parseLocalDate("2028-02-29")).toBeDefined();
	});
});

describe(formatDateLabel, () => {
	it("한국어 연월일 + 요일", () => {
		const date = parseLocalDate("2026-06-25");
		expect(date && formatDateLabel(date)).toBe("2026년 6월 25일 (목)");
		expect(date && formatDateLabelShort(date)).toBe("2026.06.25 (목)");
	});
});

describe(parseTime, () => {
	it("HH:mm만 받는다", () => {
		expect(parseTime("09:30")).toStrictEqual({ hour: 9, minute: 30 });
		expect(parseTime("24:00")).toBeUndefined();
		expect(parseTime("9:30")).toBeUndefined();
		expect(toTimeString(7, 5)).toBe("07:05");
	});
});

describe(hourOptions, () => {
	it("0시는 오전 12시, 13시는 오후 1시", () => {
		const hours = hourOptions();
		expect(hours).toHaveLength(24);
		expect(hours[0]?.label).toBe("오전 12시");
		expect(hours[12]?.label).toBe("오후 12시");
		expect(hours[13]?.label).toBe("오후 1시");
	});
});

describe(minuteOptions, () => {
	it("간격의 배수만 분 선택지가 된다", () => {
		expect(minuteOptions(15).map((m) => m.label)).toStrictEqual([
			"00분",
			"15분",
			"30분",
			"45분",
		]);
	});

	it("1시간을 나누지 않는 간격은 시/분 격자에 맞지 않고, 시각 목록으로 고른다", () => {
		expect(fitsHourGrid(30)).toBe(true);
		expect(fitsHourGrid(45)).toBe(false);
		expect(fitsHourGrid(120)).toBe(false);
		expect(timeSlots(45).slice(0, 3)).toStrictEqual([
			"00:00",
			"00:45",
			"01:30",
		]);
		expect(timeSlots(720)).toStrictEqual(["00:00", "12:00"]);
	});
});

describe(splitDateTime, () => {
	it("YYYY-MM-DDTHH:mm를 날짜/시각으로 나누고 다시 합친다", () => {
		const parts = splitDateTime("2026-06-25T19:30");
		expect(parts).toStrictEqual({ date: "2026-06-25", time: "19:30" });
		expect(joinDateTime(parts.date, parts.time, "00:00")).toBe(
			"2026-06-25T19:30",
		);
	});

	it("날짜가 없으면 값이 없고, 시각이 없으면 기본 시각을 붙인다", () => {
		expect(splitDateTime(undefined)).toStrictEqual({
			date: undefined,
			time: undefined,
		});
		expect(joinDateTime(undefined, "10:00", "00:00")).toBeUndefined();
		expect(joinDateTime("2026-06-25", undefined, "23:59")).toBe(
			"2026-06-25T23:59",
		);
	});
});
