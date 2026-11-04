import { z } from "zod";

import { ConditionSchema } from "./condition";
import { FieldSchema, LOCAL_DATETIME_PATTERN, MAX_OPTIONS } from "./fields";
import { checkDefinitionIntegrity } from "./integrity";

export const DEFINITION_SCHEMA_VERSION = 1;

const PAGE_ID_PATTERN = /^[a-z][a-z0-9_-]{0,39}$/u;
const MAX_FIELDS = 200;
const MAX_PAGES = 50;
const MAX_TEMPLATE_LENGTH = 1000;

/** 편집기가 추가 버튼을 막는 데 쓰는 상한 (스키마와 같은 값) */
export const DEFINITION_LIMITS = {
	fields: MAX_FIELDS,
	pages: MAX_PAGES,
	options: MAX_OPTIONS,
	templateLength: MAX_TEMPLATE_LENGTH,
} as const;

const PageSchema = z.object({
	id: z.string().regex(PAGE_ID_PATTERN, "페이지 id는 소문자로 시작해야 합니다"),
	title: z.string().trim().min(1, "페이지 제목을 입력해주세요").max(100),
	description: z.string().max(500).optional(),
	fieldIds: z
		.array(z.string())
		.min(1, "페이지에 질문이 하나 이상 있어야 합니다")
		.max(MAX_FIELDS),
	showIf: ConditionSchema.optional(),
});

const AmountSchema = z.discriminatedUnion("kind", [
	z.object({ kind: z.literal("fixed"), value: z.number().int().min(0) }),
	z.object({
		kind: z.literal("byOption"),
		fieldId: z.string(),
		amounts: z.record(z.string(), z.number().int().min(0)),
	}),
]);

const ReminderRuleSchema = z.object({
	firstAfterDays: z.number().int().min(1).max(60),
	intervalDays: z.number().int().min(1).max(60),
	maxCount: z.number().int().min(1).max(10),
});

const PaymentSchema = z.object({
	/** 입금 계좌 안내 문구 (예: "카카오뱅크 3333-00-0000000 홍길동") */
	account: z.string().trim().min(1, "입금 계좌를 입력해주세요").max(100),
	amount: AmountSchema,
	reminder: ReminderRuleSchema.optional(),
});

const template = z
	.string()
	.trim()
	.min(1, "알림 문구를 입력해주세요")
	.max(MAX_TEMPLATE_LENGTH);

const NotificationsSchema = z.object({
	onCreate: template.optional(),
	onUpdate: template.optional(),
	onReminder: template.optional(),
});

const BaseDefinitionSchema = z.object({
	schemaVersion: z.literal(DEFINITION_SCHEMA_VERSION),
	title: z.string().trim().min(1, "폼 제목을 입력해주세요").max(100),
	description: z.string().max(2000).optional(),
	/** IANA 타임존. 날짜/시간 표시와 시트 타임스탬프 포맷에 사용 */
	timezone: z.string().min(1).default("Asia/Seoul"),
	/** 이 시각(로컬) 이후 제출 거부 */
	closesAt: z.string().regex(LOCAL_DATETIME_PATTERN).optional(),
	fields: z
		.array(FieldSchema)
		.min(1, "질문이 하나 이상 필요합니다")
		.max(MAX_FIELDS),
	pages: z.array(PageSchema).min(1).max(MAX_PAGES),
	/** 중복 제출 판정 키. 같은 값으로 다시 제출하면 기존 응답을 수정한다. */
	identity: z.object({ fieldId: z.string() }),
	/** SMS 수신 번호로 쓸 phone 필드 */
	contact: z.object({ phoneFieldId: z.string() }).optional(),
	payment: PaymentSchema.optional(),
	notifications: NotificationsSchema.optional(),
	/** 완료 화면 안내 문구 */
	completionMessage: z.string().max(1000).optional(),
});

/**
 * 폼 정의 스키마.
 * 구조 검증 + 상호 참조 무결성(필드/페이지/조건/결제/알림)까지 검사한다.
 */
export const FormDefinitionSchema = BaseDefinitionSchema.superRefine(
	(definition, ctx) => {
		for (const issue of checkDefinitionIntegrity(definition)) {
			ctx.addIssue({
				code: "custom",
				message: issue.message,
				path: issue.path,
			});
		}
	},
);

export type FormDefinition = z.output<typeof FormDefinitionSchema>;
export type FormDefinitionInput = z.input<typeof FormDefinitionSchema>;
export type PageDef = z.infer<typeof PageSchema>;
export type PaymentDef = z.infer<typeof PaymentSchema>;
export type ReminderRule = z.infer<typeof ReminderRuleSchema>;
export type NotificationKind = keyof z.infer<typeof NotificationsSchema>;

export type DefinitionParseResult =
	| { ok: true; definition: FormDefinition }
	| { ok: false; issues: { path: string; message: string }[] };

/** 스키마에 직접 적지 않은 일반 오류(범위/형식)를 한국어로. 전역 설정이 아니라 이 파싱에만 적용한다. */
const KOREAN_ERRORS = z.locales.ko().localeError;

/** 외부 입력(관리자 편집기, DB에서 읽은 값)을 경계에서 검증한다. */
export function parseFormDefinition(input: unknown): DefinitionParseResult {
	const result = FormDefinitionSchema.safeParse(input, {
		error: KOREAN_ERRORS,
	});
	if (result.success) {
		return { ok: true, definition: result.data };
	}
	return {
		ok: false,
		issues: result.error.issues.map((issue) => ({
			path: issue.path.join("."),
			message: issue.message,
		})),
	};
}
