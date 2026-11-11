import type { AnswerValue } from "../answers/value";
import type { FieldDef } from "../definition/fields";
import type { CellValueKind, SheetPart } from "../field-types/spec";
import {
	checkFieldValue,
	formatFieldValue,
	parseFieldText,
} from "../field-types/values";
import type { ValueCheck } from "../field-types/values";
import { formatInTimeZone } from "../time";

/**
 * 시트 셀 값 변환. 값 종류(CellValueKind, 필드 타입 레지스트리의 sheet.value)마다 한 항목.
 * 날짜/시간 답변은 스프레드시트의 날짜 일련번호(1899-12-30부터의 일수, 소수부 = 하루 중 시각)로 쓴다.
 * 그래야 시트에서 서식("2026년 06월 26일", "오후 10:00")으로 보이고 날짜·시간 순 정렬이 맞다.
 * 일련번호는 타임존이 없는 벽시계 값이라 답변의 로컬 날짜/시각을 그대로 옮긴다 (DST 영향 없음).
 */

/** 시트에서 읽은 셀 (서식 없는 원래 값) */
export type SheetCell = string | number | boolean;

const MS_PER_DAY = 86_400_000;
const MINUTES_PER_DAY = 1440;
const MINUTES_PER_HOUR = 60;
const SERIAL_EPOCH_MS = Date.UTC(1899, 11, 30);
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

function pad2(value: number): string {
	return String(value).padStart(2, "0");
}

/** "2026-06-26" → 46199 */
function dateToSerial(date: string): number {
	const [year = 0, month = 1, day = 1] = date.split("-").map(Number);
	return (Date.UTC(year, month - 1, day) - SERIAL_EPOCH_MS) / MS_PER_DAY;
}

/** "22:00" → 0.9166… */
function timeToSerial(time: string): number {
	const [hour = 0, minute = 0] = time.split(":").map(Number);
	return (hour * MINUTES_PER_HOUR + minute) / MINUTES_PER_DAY;
}

/** 일련번호 → 분 단위로 반올림한 { 날짜, 시각 } (부동소수 오차로 59.999분이 되는 것을 막는다) */
function serialParts(serial: number): { date: string; time: string } {
	const totalMinutes = Math.round(serial * MINUTES_PER_DAY);
	const days = Math.floor(totalMinutes / MINUTES_PER_DAY);
	const minutes = totalMinutes - days * MINUTES_PER_DAY;
	const date = new Date(SERIAL_EPOCH_MS + days * MS_PER_DAY);
	return {
		date: `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`,
		time: `${pad2(Math.floor(minutes / MINUTES_PER_HOUR))}:${pad2(minutes % MINUTES_PER_HOUR)}`,
	};
}

interface CellCodec {
	/** 검증된 답변 → 셀 */
	write: (field: FieldDef, value: AnswerValue) => string | number;
	/** 셀 → 검증된 답변 (실패면 이유) */
	read: (field: FieldDef, cell: SheetCell) => ValueCheck;
}

/** 글자 칸: 사람이 읽는 텍스트로 쓰고, 글자로 읽는다 */
const TEXT_CODEC: CellCodec = {
	write: formatFieldValue,
	read: (field, cell) => parseFieldText(field, String(cell)),
};

/**
 * 일련번호 칸. 숫자 셀은 일련번호로 읽고, 글자 셀(이전 버전이 쓴 "2026-06-26 14:30" 등)은
 * 타입별 텍스트 해석을 따른다.
 */
function serialCodec(
	toSerial: (value: string) => number,
	fromSerial: (serial: number) => string,
): CellCodec {
	return {
		write: (_field, value) => toSerial(String(value)),
		read: (field, cell) =>
			typeof cell === "number"
				? checkFieldValue(field, fromSerial(cell))
				: TEXT_CODEC.read(field, cell),
	};
}

export const CELL_CODECS: Record<CellValueKind, CellCodec> = {
	text: TEXT_CODEC,
	// 숫자 칸은 숫자로 쓴다 (시트에서 합계·정렬이 된다). 읽기는 글자 해석이 쉼표도 처리한다
	number: {
		write: (_field, value) => Number(value),
		read: TEXT_CODEC.read,
	},
	date: serialCodec(dateToSerial, (serial) => serialParts(serial).date),
	time: serialCodec(timeToSerial, (serial) => serialParts(serial).time),
	datetime: serialCodec(
		(value) =>
			dateToSerial(value.slice(0, 10)) + timeToSerial(value.slice(11, 16)),
		(serial) => {
			const { date, time } = serialParts(serial);
			return `${date}T${time}`;
		},
	),
};

/**
 * 일시 답변("YYYY-MM-DDTHH:mm")을 날짜 열·시간 열로 나눌 때의 조각 변환 (sheet/rows.ts가 합친다).
 * decode는 검증 전 후보 문자열이다: 숫자는 일련번호, 글자는 "2026-06-26" / "14:30" 형식으로 읽는다.
 */
interface PartCodec {
	decode: (cell: SheetCell) => string;
	write: (datetime: string) => number;
}

export const PART_CODECS: Record<SheetPart, PartCodec> = {
	date: {
		write: (datetime) => dateToSerial(datetime.slice(0, 10)),
		decode: (cell) =>
			typeof cell === "number"
				? serialParts(cell).date
				: String(cell).trim().slice(0, 10),
	},
	time: {
		write: (datetime) => timeToSerial(datetime.slice(11, 16)),
		decode: (cell) =>
			typeof cell === "number"
				? serialParts(cell).time
				: String(cell).trim().padStart(5, "0"),
	},
};

/** 신청일시 셀 텍스트: "2026년 06월 01일 (월) 20:45" (해당 타임존 기준) */
export function submittedAtText(epochMs: number, timeZone: string): string {
	const local = formatInTimeZone(epochMs, timeZone);
	const [year = 0, month = 1, day = 1] = local
		.slice(0, 10)
		.split("-")
		.map(Number);
	const weekday =
		WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
	return `${year}년 ${pad2(month)}월 ${pad2(day)}일 (${weekday}) ${local.slice(11, 16)}`;
}
