import { z } from "zod";

/**
 * 조건 표현식.
 * 필드/페이지 표시 여부를 데이터로 표현한다(왈라폼의 "로직"에 해당).
 */
export type Condition =
	| { op: "equals"; fieldId: string; value: string | number | boolean }
	| { op: "notEquals"; fieldId: string; value: string | number | boolean }
	| { op: "in"; fieldId: string; values: string[] }
	| { op: "answered"; fieldId: string }
	| { op: "all"; conditions: Condition[] }
	| { op: "any"; conditions: Condition[] }
	| { op: "not"; condition: Condition };

const MAX_NESTED_CONDITIONS = 20;
const scalar = z.union([z.string().max(200), z.number(), z.boolean()]);

export const ConditionSchema: z.ZodType<Condition> = z.lazy(() =>
	z.discriminatedUnion("op", [
		z.object({ op: z.literal("equals"), fieldId: z.string(), value: scalar }),
		z.object({
			op: z.literal("notEquals"),
			fieldId: z.string(),
			value: scalar,
		}),
		z.object({
			op: z.literal("in"),
			fieldId: z.string(),
			values: z.array(z.string().max(200)).min(1).max(100),
		}),
		z.object({ op: z.literal("answered"), fieldId: z.string() }),
		z.object({
			op: z.literal("all"),
			conditions: z.array(ConditionSchema).min(1).max(MAX_NESTED_CONDITIONS),
		}),
		z.object({
			op: z.literal("any"),
			conditions: z.array(ConditionSchema).min(1).max(MAX_NESTED_CONDITIONS),
		}),
		z.object({ op: z.literal("not"), condition: ConditionSchema }),
	]),
);

/** 조건식이 참조하는 모든 fieldId를 수집한다. */
export function collectConditionFieldIds(condition: Condition): string[] {
	switch (condition.op) {
		case "all":
		case "any": {
			return condition.conditions.flatMap(collectConditionFieldIds);
		}
		case "not": {
			return collectConditionFieldIds(condition.condition);
		}
		case "equals":
		case "notEquals":
		case "in":
		case "answered": {
			return [condition.fieldId];
		}
		default: {
			// ConditionSchema를 통과한 조건은 여기에 오지 않는다 (알 수 없는 op는 파싱 단계에서 거부)
			return [];
		}
	}
}
