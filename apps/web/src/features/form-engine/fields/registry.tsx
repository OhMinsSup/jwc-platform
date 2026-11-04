import type { FieldOf, FieldType } from "@jwc/form-core/definition/fields";
import type { ComponentType } from "react";

import {
	BooleanField,
	MultiChoiceField,
	RatingField,
	SingleChoiceField,
} from "./choice-fields";
import { DateField, DateTimeField, TimeField } from "./temporal-fields";
import {
	EmailField,
	LongTextField,
	NumberField,
	PhoneField,
	ShortTextField,
} from "./text-fields";
import type { FieldProps } from "./types";

/** 필드 타입 → 입력 컴포넌트 테이블. switch 분기 대신 조회. */
type RendererTable = {
	[K in FieldType]: ComponentType<FieldProps<FieldOf<K>>> | null;
};

const RENDERERS: RendererTable = {
	short_text: ShortTextField,
	long_text: LongTextField,
	number: NumberField,
	phone: PhoneField,
	email: EmailField,
	single_choice: SingleChoiceField,
	multi_choice: MultiChoiceField,
	boolean: BooleanField,
	date: DateField,
	time: TimeField,
	datetime: DateTimeField,
	rating: RatingField,
	/** 안내문은 입력이 없다 (FieldShell이 설명만 표시) */
	statement: null,
};

/**
 * 화면에서 쓰는 조회 테이블: `FIELD_RENDERERS[field.type]`.
 * 함수 호출 대신 테이블 조회로 두어 렌더 중에 컴포넌트를 "만드는" 것처럼 보이지 않게 한다.
 */
export const FIELD_RENDERERS: Readonly<
	Record<FieldType, ComponentType<FieldProps> | null>
> =
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- 타입 K의 렌더러에는 field.type이 K인 필드만 넘어간다. 키와 값의 상관관계(상관 유니온)를 TS가 표현하지 못해 넓힌다
	RENDERERS as Readonly<Record<FieldType, ComponentType<FieldProps> | null>>;
