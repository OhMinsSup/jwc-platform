import type { z } from "zod";

import type { AnswerValue } from "../answers/value";
import type { FieldDef, FieldOf, FieldType } from "../definition/fields";

/**
 * 시트 칸에 담는 값의 종류. 날짜·시간은 스프레드시트 일련번호, number는 숫자, 나머지는 글자로 쓴다
 * (변환은 sheet/cells.ts의 CELL_CODECS, 표시 서식은 저장소 어댑터가 정한다).
 */
export type CellValueKind = "text" | "number" | "date" | "time" | "datetime";

/** 한 답변을 여러 시트 열로 나눌 때의 조각. 조각 이름이 곧 그 열의 값 종류다 */
export type SheetPart = "date" | "time";

/** 시트 칸 정보: 값 종류와 드롭다운 선택지(하나만 고르는 타입만) */
export interface SheetCellSpec<F extends FieldDef> {
	choices?: (field: F) => string[];
	/**
	 * 시트에서 한 답변을 이 조각들의 열로 나눈다 (예: 일시 → 날짜 열 + 시간 열).
	 * 운영자가 시트 표에서 날짜·시간을 각각의 값으로 고칠 수 있게 한다. 없으면 열 하나.
	 */
	parts?: readonly SheetPart[];
	value: CellValueKind;
}

/**
 * 필드 타입별 동작을 "데이터 테이블"로 표현한다.
 * 새 타입 추가 = 이 인터페이스를 구현한 항목 하나 추가. 분기문 수정 불필요.
 */
export interface FieldTypeSpec<F extends FieldDef> {
	/** 값 → 사람이 읽는 텍스트 (시트 셀, 확인 화면, 메시지) */
	format: (field: F, value: AnswerValue) => string;
	/** 시트 셀 텍스트 → valueSchema에 넣을 후보 값 */
	fromText: (field: F, text: string) => unknown;
	/** 응답 시트 칸 */
	sheet: SheetCellSpec<F>;
	/** 비어있지 않은 입력을 검증/정규화하는 스키마 */
	valueSchema: (field: F) => z.ZodType<AnswerValue>;
}

export type FieldTypeRegistry = { [K in FieldType]: FieldTypeSpec<FieldOf<K>> };
