import type { z } from "zod";

import type { AnswerValue } from "../answers/value";
import type { FieldDef, FieldOf, FieldType } from "../definition/fields";

/**
 * 필드 타입별 동작을 "데이터 테이블"로 표현한다.
 * 새 타입 추가 = 이 인터페이스를 구현한 항목 하나 추가. 분기문 수정 불필요.
 */
export interface FieldTypeSpec<F extends FieldDef> {
	/** 값 → 사람이 읽는 텍스트 (시트 셀, 확인 화면, 메시지) */
	format: (field: F, value: AnswerValue) => string;
	/** 시트 셀 텍스트 → valueSchema에 넣을 후보 값 */
	fromText: (field: F, text: string) => unknown;
	/** 비어있지 않은 입력을 검증/정규화하는 스키마 */
	valueSchema: (field: F) => z.ZodType<AnswerValue>;
}

export type FieldTypeRegistry = { [K in FieldType]: FieldTypeSpec<FieldOf<K>> };
