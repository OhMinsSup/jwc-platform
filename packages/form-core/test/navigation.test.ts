import { describe, expect, it } from "vite-plus/test";

import {
	firstPageId,
	nextStep,
	parseFormDefinition,
	previousPageId,
} from "../src";
import type { FormDefinition } from "../src";
import { retreat, validRetreatAnswers } from "./fixtures";

function withConditionalPage(): FormDefinition {
	const base = retreat();
	const parsed = parseFormDefinition({
		...base,
		pages: base.pages.map((page) =>
			page.id === "support"
				? {
						...page,
						showIf: { op: "equals", fieldId: "department", value: "youth1" },
					}
				: page,
		),
	});
	if (!parsed.ok) {
		throw new Error(JSON.stringify(parsed.issues));
	}
	return parsed.definition;
}

describe("페이지 이동", () => {
	it("첫 페이지 → 다음 → 마지막 다음은 review", () => {
		const definition = retreat();
		expect(firstPageId(definition)).toBe("personal");
		expect(nextStep(definition, validRetreatAnswers, "personal")).toStrictEqual(
			{
				kind: "page",
				pageId: "attendance",
			},
		);
		expect(nextStep(definition, validRetreatAnswers, "support")).toStrictEqual({
			kind: "review",
		});
	});

	it("조건부 페이지가 숨겨지면 건너뛴다", () => {
		const definition = withConditionalPage();
		const answers = { ...validRetreatAnswers, department: "youth2" };
		expect(nextStep(definition, answers, "attendance")).toStrictEqual({
			kind: "review",
		});
		expect(previousPageId(definition, answers, { kind: "review" })).toBe(
			"attendance",
		);
	});

	it("첫 페이지의 이전은 null", () => {
		expect(
			previousPageId(retreat(), {}, { kind: "page", pageId: "personal" }),
		).toBeNull();
	});
});
