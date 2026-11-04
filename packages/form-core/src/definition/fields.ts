import { z } from "zod";

import { ConditionSchema } from "./condition";

/** 필드 id 규칙: 템플릿 변수/시트 매핑의 키로 쓰이므로 엄격히 제한한다. */
export const FIELD_ID_PATTERN = /^[a-z][a-z0-9_]{0,39}$/u;
/** 로컬 날짜/시간 표기 (타임존 없는 벽시계 시간) */
export const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
export const LOCAL_TIME_PATTERN = /^\d{2}:\d{2}$/u;
export const LOCAL_DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/u;

export const MAX_OPTIONS = 100;
const OPTION_VALUE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$/u;

const OptionSchema = z.object({
	value: z
		.string()
		.regex(OPTION_VALUE_PATTERN, "옵션 값은 영문/숫자/-/_ 만 허용합니다"),
	label: z.string().trim().min(1, "선택지 이름을 입력해주세요").max(100),
	description: z.string().max(200).optional(),
});

const fieldBase = {
	id: z
		.string()
		.regex(
			FIELD_ID_PATTERN,
			"필드 id는 소문자로 시작하는 snake_case여야 합니다",
		),
	label: z.string().trim().min(1, "질문 제목을 입력해주세요").max(100),
	description: z.string().max(500).optional(),
	required: z.boolean().default(false),
	/** 시트 헤더. 없으면 label을 쓴다. */
	columnHeader: z.string().trim().min(1).max(100).optional(),
	placeholder: z.string().max(100).optional(),
	showIf: ConditionSchema.optional(),
};

const options = z
	.array(OptionSchema)
	.min(1, "선택지가 하나 이상 필요합니다")
	.max(MAX_OPTIONS);

export const FieldSchema = z.discriminatedUnion("type", [
	z.object({
		...fieldBase,
		type: z.literal("short_text"),
		minLength: z.number().int().min(0).max(1000).optional(),
		maxLength: z.number().int().min(1).max(1000).default(200),
	}),
	z.object({
		...fieldBase,
		type: z.literal("long_text"),
		maxLength: z.number().int().min(1).max(5000).default(2000),
	}),
	z.object({
		...fieldBase,
		type: z.literal("number"),
		min: z.number().optional(),
		max: z.number().optional(),
		integer: z.boolean().default(false),
	}),
	z.object({ ...fieldBase, type: z.literal("phone") }),
	z.object({ ...fieldBase, type: z.literal("email") }),
	z.object({
		...fieldBase,
		type: z.literal("single_choice"),
		options,
		display: z.enum(["chips", "cards", "dropdown"]).default("chips"),
	}),
	z.object({
		...fieldBase,
		type: z.literal("multi_choice"),
		options,
		minSelect: z.number().int().min(1).optional(),
		maxSelect: z.number().int().min(1).optional(),
	}),
	z.object({
		...fieldBase,
		type: z.literal("boolean"),
		trueLabel: z.string().min(1).max(30).default("예"),
		falseLabel: z.string().min(1).max(30).default("아니오"),
	}),
	z.object({
		...fieldBase,
		type: z.literal("date"),
		min: z.string().regex(LOCAL_DATE_PATTERN).optional(),
		max: z.string().regex(LOCAL_DATE_PATTERN).optional(),
	}),
	z.object({
		...fieldBase,
		type: z.literal("time"),
		stepMinutes: z.number().int().min(1).max(720).default(30),
	}),
	z.object({
		...fieldBase,
		type: z.literal("datetime"),
		min: z.string().regex(LOCAL_DATETIME_PATTERN).optional(),
		max: z.string().regex(LOCAL_DATETIME_PATTERN).optional(),
		stepMinutes: z.number().int().min(1).max(720).default(30),
	}),
	z.object({
		...fieldBase,
		type: z.literal("rating"),
		scale: z.union([z.literal(5), z.literal(10)]).default(5),
	}),
	z.object({ ...fieldBase, type: z.literal("statement") }),
]);

export type FieldDef = z.infer<typeof FieldSchema>;
export type FieldType = FieldDef["type"];
export type FieldOf<T extends FieldType> = Extract<FieldDef, { type: T }>;
export type ChoiceOption = z.infer<typeof OptionSchema>;
export type ChoiceField = FieldOf<"single_choice"> | FieldOf<"multi_choice">;

export function isChoiceField(field: FieldDef): field is ChoiceField {
	return field.type === "single_choice" || field.type === "multi_choice";
}

/** 시트/답변이 없는 표시 전용 필드인지 */
export function isDisplayOnly(field: FieldDef): boolean {
	return field.type === "statement";
}

export function columnHeaderOf(field: FieldDef): string {
	return field.columnHeader ?? field.label;
}
