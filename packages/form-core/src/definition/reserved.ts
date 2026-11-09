/** 메시지 템플릿 내장 변수. 필드 id와 충돌하면 안 된다. */
export const BUILTIN_TEMPLATE_KEYS = [
	"title",
	"amount",
	"account",
	"link",
	"submission_id",
] as const;
export type BuiltinTemplateKey = (typeof BUILTIN_TEMPLATE_KEYS)[number];
export const RESERVED_TEMPLATE_KEYS: ReadonlySet<string> = new Set(
	BUILTIN_TEMPLATE_KEYS,
);
