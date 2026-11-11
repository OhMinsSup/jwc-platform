import type { FieldType } from "@jwc/form-core/definition/fields";
import type { SystemColumnKey } from "@jwc/form-core/definition/system-columns";
import type { CellValueKind, SheetPart } from "@jwc/form-core/field-types/spec";
import type { SheetColumn } from "@jwc/form-core/sheet/columns";

/**
 * 응답 탭의 Google 표시 정보 표. 응답은 시트의 "표"(데이터 테이블)로 만들고, 표의 색·열 타입·서식·너비를 여기서 정한다.
 * 무엇을 쓰는지(값 종류, 선택지)는 form-core가 정하고, 여기는 어떻게 보이는지만 정한다.
 */

interface Rgb {
	red: number;
	green: number;
	blue: number;
}

/** 0–255 → Sheets API의 0–1 색 */
function rgb(red: number, green: number, blue: number): Rgb {
	const MAX = 255;
	return { red: red / MAX, green: green / MAX, blue: blue / MAX };
}

export const SHEET_COLORS = {
	/** 표 머리글 #356854 */
	header: rgb(53, 104, 84),
	headerText: rgb(255, 255, 255),
	/** 표 본문 줄무늬 #FFFFFF / #F6F8F9 */
	firstBand: rgb(255, 255, 255),
	secondBand: rgb(246, 248, 249),
} as const;

/** 시트 "표"의 열 타입 (Sheets API ColumnType 중 이 앱이 쓰는 것) */
export type TableColumnType =
	| "TEXT"
	| "DOUBLE"
	| "DATE"
	| "TIME"
	| "DATE_TIME"
	| "DROPDOWN";

/** 값 종류 → 표 열 타입. 선택지가 있는 열은 값 종류와 관계없이 DROPDOWN이다 */
export const TABLE_COLUMN_TYPES: Record<CellValueKind, TableColumnType> = {
	text: "TEXT",
	number: "DOUBLE",
	date: "DATE",
	time: "TIME",
	datetime: "DATE_TIME",
};

/** 스프레드시트 숫자 서식 */
export type NumberFormat =
	| { type: "DATE" | "TIME" | "DATE_TIME"; pattern: string }
	| { type: "TEXT" };

interface ValueFormat {
	/** null이면 서식을 걸지 않는다 (시트 기본값) */
	numberFormat: NumberFormat | null;
	/**
	 * 기존 열에도 다시 걸지. 일련번호로 쓰는 날짜·시간은 서식이 없으면 숫자로 보이므로 항상 건다.
	 * 그 밖의 서식은 새 열에만 건다 (운영자가 바꾼 서식을 덮지 않는다).
	 */
	reapply: boolean;
}

/** 값 종류별 열 서식. 글자 칸은 TEXT로 두어 운영자 입력("3/5", "010…")이 날짜·숫자로 바뀌지 않게 한다 */
export const VALUE_FORMATS: Record<CellValueKind, ValueFormat> = {
	text: { numberFormat: { type: "TEXT" }, reapply: false },
	number: { numberFormat: null, reapply: false },
	date: {
		numberFormat: { type: "DATE", pattern: "yyyy년 mm월 dd일" },
		reapply: true,
	},
	time: {
		numberFormat: { type: "TIME", pattern: "am/pm h:mm" },
		reapply: true,
	},
	datetime: {
		numberFormat: { type: "DATE_TIME", pattern: "yyyy년 mm월 dd일 am/pm h:mm" },
		reapply: true,
	},
};

/** 열 너비(px). 새 열에만 건다 */
const SYSTEM_WIDTHS: Record<SystemColumnKey, number> = {
	id: 50,
	submittedAt: 170,
	paid: 60,
};

const FIELD_WIDTHS: Record<FieldType, number> = {
	short_text: 90,
	long_text: 300,
	number: 80,
	phone: 104,
	email: 180,
	single_choice: 90,
	multi_choice: 150,
	boolean: 60,
	date: 150,
	time: 110,
	datetime: 220,
	rating: 60,
	statement: 90,
};

/** 일시 답변을 나눈 열(날짜·시간)의 너비 */
const PART_WIDTHS: Record<SheetPart, number> = {
	date: 150,
	time: 110,
};

export function columnWidthOf(column: SheetColumn): number {
	if (column.kind === "system") {
		return SYSTEM_WIDTHS[column.key];
	}
	return column.part === "whole"
		? FIELD_WIDTHS[column.field.type]
		: PART_WIDTHS[column.part];
}
