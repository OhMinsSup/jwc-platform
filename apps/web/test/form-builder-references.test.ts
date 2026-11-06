import type { Condition } from "@jwc/form-core/definition/condition";
import { parseFormDefinition } from "@jwc/form-core/definition/definition";
import type { FormDefinition } from "@jwc/form-core/definition/definition";
import { retreat2026Definition } from "@jwc/form-core/samples/retreat-2026";
import { describe, expect, it } from "vite-plus/test";

import {
	fromDraft,
	ruleFor,
	toDraft,
	valueChoicesOf,
	withOp,
} from "../src/features/form-builder/model/conditions";
import { updateOptionRefs } from "../src/features/form-builder/model/option-references";
import {
	referencesTo,
	removeField,
	renameField,
} from "../src/features/form-builder/model/references";

function retreat(): FormDefinition {
	const parsed = parseFormDefinition(retreat2026Definition);
	if (!parsed.ok) {
		throw new Error(JSON.stringify(parsed.issues));
	}
	return parsed.definition;
}

const field = (definition: FormDefinition, id: string) =>
	definition.fields.find((f) => f.id === id);

describe(renameField, () => {
	it("propagates to pages and conditions", () => {
		const next = renameField(retreat(), "stay_type", "stay");
		expect(parseFormDefinition(next).ok).toBe(true);
		expect(next.pages[1]?.fieldIds[0]).toBe("stay");
		expect(field(next, "arrival_at")?.showIf).toStrictEqual({
			op: "notEquals",
			fieldId: "stay",
			value: "full",
		});
	});

	it("propagates to payment, contact and templates", () => {
		const next = renameField(retreat(), "stay_type", "stay");
		expect(next.payment?.amount).toMatchObject({ fieldId: "stay" });
		expect(next.notifications?.onCreate).toContain("{{stay}}");
		expect(next.notifications?.onCreate).not.toContain("stay_type");
	});

	it("keeps untouched fields as the same objects (structural sharing)", () => {
		const before = retreat();
		const next = renameField(before, "stay_type", "stay");
		expect(field(next, "name")).toBe(field(before, "name"));
		expect(field(next, "ride_details")).toBe(field(before, "ride_details"));
	});

	it("renames identity and contact anchors", () => {
		const next = renameField(retreat(), "phone", "mobile");
		expect(next.identity.fieldId).toBe("mobile");
		expect(next.contact?.phoneFieldId).toBe("mobile");
	});
});

describe(removeField, () => {
	it("drops conditions that referenced it and clears payment anchor", () => {
		const next = removeField(retreat(), "stay_type");
		expect(field(next, "stay_type")).toBeUndefined();
		expect(field(next, "arrival_at")?.showIf).toBeUndefined();
		expect(next.pages[1]?.fieldIds).not.toContain("stay_type");
		expect(next.payment?.amount).toStrictEqual({
			kind: "byOption",
			fieldId: "",
			amounts: {},
		});
	});

	it("surfaces a cleared identity as a validation error instead of guessing", () => {
		const next = removeField(retreat(), "phone");
		expect(next.identity.fieldId).toBe("");
		expect(parseFormDefinition(next).ok).toBe(false);
	});

	it("lists every place that will be affected", () => {
		const refs = referencesTo(retreat(), "stay_type");
		expect(refs).toStrictEqual(
			expect.arrayContaining([
				'질문 "참석(픽업) 희망 일시"의 표시 조건',
				"선택지별 결제 금액",
				"알림 문구의 변수",
			]),
		);
		expect(referencesTo(retreat(), "tf_team")).toStrictEqual([]);
	});
});

describe(updateOptionRefs, () => {
	it("renames option values in conditions and payment amounts", () => {
		const next = updateOptionRefs(retreat(), "stay_type", "full", "all_days");
		expect(parseFormDefinition(next).ok).toBe(true);
		expect(field(next, "arrival_at")?.showIf).toMatchObject({
			value: "all_days",
		});
		expect(next.payment?.amount).toMatchObject({
			amounts: { all_days: 65_000, n2d3: 55_000 },
		});
	});

	it("removing an option drops the condition leaf and its amount", () => {
		const next = updateOptionRefs(retreat(), "stay_type", "full", null);
		expect(field(next, "arrival_at")?.showIf).toBeUndefined();
		const amount = next.payment?.amount;
		expect(amount?.kind === "byOption" && "full" in amount.amounts).toBe(false);
	});
});

describe("condition draft model", () => {
	it("round-trips the shapes the editor supports", () => {
		const shapes = [
			{ op: "equals", fieldId: "a", value: "x" },
			{ op: "not", condition: { op: "answered", fieldId: "a" } },
			{
				op: "any",
				conditions: [
					{ op: "in", fieldId: "a", values: ["x", "y"] },
					{ op: "answered", fieldId: "b" },
				],
			},
		] satisfies Condition[];
		for (const shape of shapes) {
			const draft = toDraft(shape);
			expect(draft).not.toBeNull();
			expect(fromDraft(draft ?? { join: "all", rules: [] })).toStrictEqual(
				shape,
			);
		}
	});

	it("refuses nested groups instead of silently rewriting them", () => {
		const nested: Condition = {
			op: "all",
			conditions: [
				{ op: "any", conditions: [{ op: "answered", fieldId: "a" }] },
			],
		};
		expect(toDraft(nested)).toBeNull();
	});

	it("no rules means always visible", () => {
		expect(fromDraft({ join: "all", rules: [] })).toBeUndefined();
	});

	it("picks a type-appropriate default rule and converts value shape on op change", () => {
		const stay = field(retreat(), "stay_type");
		if (!stay) {
			throw new Error("fixture");
		}
		const rule = ruleFor(stay);
		expect(rule).toStrictEqual({
			fieldId: "stay_type",
			op: "equals",
			value: "full",
		});
		expect(withOp(rule, "in")).toStrictEqual({
			fieldId: "stay_type",
			op: "in",
			values: ["full"],
		});
		expect(withOp(rule, "answered")).toStrictEqual({
			fieldId: "stay_type",
			op: "answered",
		});
	});
});

describe(valueChoicesOf, () => {
	it("lists real options so a condition value cannot be mistyped", () => {
		const stay = field(retreat(), "stay_type");
		const listed = stay ? valueChoicesOf(stay) : null;
		expect(listed?.choices.map((c) => c.value)).toStrictEqual([
			"full",
			"n2d3",
			"n1d2",
			"day",
		]);
		expect(listed?.parse("full")).toBe("full");
	});

	it("maps yes/no labels back to booleans", () => {
		const canRide = field(retreat(), "can_ride");
		const listed = canRide ? valueChoicesOf(canRide) : null;
		expect(listed?.choices.map((c) => c.label)).toStrictEqual(["가능", "불가"]);
		expect(listed?.parse("false")).toBe(false);
	});

	it("returns null for free-text questions", () => {
		const name = field(retreat(), "name");
		expect(name && valueChoicesOf(name)).toBeNull();
	});
});
