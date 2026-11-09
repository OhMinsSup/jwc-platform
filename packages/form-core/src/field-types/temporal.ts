import { z } from "zod";

import {
	LOCAL_DATE_PATTERN,
	LOCAL_DATETIME_PATTERN,
	LOCAL_TIME_PATTERN,
} from "../definition/fields";
import type { FieldOf } from "../definition/fields";
import { isRealDate, minutesOfDay } from "../time";
import type { FieldTypeSpec } from "./spec";

/** 시트 셀에서는 "T" 대신 공백을 쓴다: "2026-06-25 14:30" */
const CELL_DATETIME = /^(?<date>\d{4}-\d{2}-\d{2})[ T](?<time>\d{2}:\d{2})/u;

function onStep(time: string, stepMinutes: number): boolean {
	const minutes = minutesOfDay(time);
	return minutes !== null && minutes % stepMinutes === 0;
}

export const dateSpec: FieldTypeSpec<FieldOf<"date">> = {
	valueSchema: (field) =>
		z
			.string()
			.regex(LOCAL_DATE_PATTERN, "YYYY-MM-DD 형식이어야 합니다")
			.refine(isRealDate, "존재하지 않는 날짜입니다")
			.refine(
				(v) => !field.min || v >= field.min,
				`${field.min} 이후 날짜를 선택해주세요`,
			)
			.refine(
				(v) => !field.max || v <= field.max,
				`${field.max} 이전 날짜를 선택해주세요`,
			),
	format: (_field, value) => String(value),
	fromText: (_field, text) => text.trim().slice(0, 10),
};

export const timeSpec: FieldTypeSpec<FieldOf<"time">> = {
	valueSchema: (field) =>
		z
			.string()
			.regex(LOCAL_TIME_PATTERN, "HH:mm 형식이어야 합니다")
			.refine((v) => minutesOfDay(v) !== null, "존재하지 않는 시간입니다")
			.refine(
				(v) => onStep(v, field.stepMinutes),
				`${field.stepMinutes}분 단위로 선택해주세요`,
			),
	format: (_field, value) => String(value),
	fromText: (_field, text) => text.trim().padStart(5, "0"),
};

export const datetimeSpec: FieldTypeSpec<FieldOf<"datetime">> = {
	valueSchema: (field) =>
		z
			.string()
			.regex(LOCAL_DATETIME_PATTERN, "날짜와 시간을 선택해주세요")
			.refine((v) => isRealDate(v.slice(0, 10)), "존재하지 않는 날짜입니다")
			.refine(
				(v) => onStep(v.slice(11), field.stepMinutes),
				`${field.stepMinutes}분 단위로 선택해주세요`,
			)
			.refine(
				(v) => !field.min || v >= field.min,
				"선택 가능한 기간보다 이릅니다",
			)
			.refine(
				(v) => !field.max || v <= field.max,
				"선택 가능한 기간보다 늦습니다",
			),
	format: (_field, value) => String(value).replace("T", " "),
	fromText: (_field, text) => {
		const groups = CELL_DATETIME.exec(text.trim())?.groups;
		if (groups?.date === undefined || groups.time === undefined) {
			return text.trim();
		}
		return `${groups.date}T${groups.time}`;
	},
};
