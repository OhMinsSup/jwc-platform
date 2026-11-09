import {
	DEFINITION_LIMITS,
	parseFormDefinition,
} from "@jwc/form-core/definition/definition";
import type { FormDefinition } from "@jwc/form-core/definition/definition";
import { retreat2026Definition } from "@jwc/form-core/samples/retreat-2026";
import { describe, expect, it } from "vite-plus/test";

import type { EditorAction } from "../src/features/form-builder/model/actions";
import { moveTarget } from "../src/features/form-builder/model/derive";
import { nextFieldId } from "../src/features/form-builder/model/ids";
import { validateDefinition } from "../src/features/form-builder/model/issues";
import { toEditable } from "../src/features/form-builder/model/load";
import { editorReducer } from "../src/features/form-builder/model/reducer";

function retreat(): FormDefinition {
	const parsed = parseFormDefinition(retreat2026Definition);
	if (!parsed.ok) {
		throw new Error(JSON.stringify(parsed.issues));
	}
	return parsed.definition;
}

/** 동작을 차례로 적용한 결과 (리듀서 사용 예) */
function run(state: FormDefinition, ...actions: EditorAction[]) {
	let next = state;
	for (const action of actions) {
		next = editorReducer(next, action);
	}
	return next;
}

describe("fields", () => {
	it("adds a question at the end of the page with a fresh id", () => {
		const state = retreat();
		const fieldId = nextFieldId(state);
		const next = run(state, {
			type: "field/add",
			pageId: "support",
			fieldId,
			fieldType: "short_text",
		});
		expect(next.pages[2]?.fieldIds.at(-1)).toBe(fieldId);
		expect(parseFormDefinition(next).ok).toBe(true);
	});

	it("ignores an add that would reuse an existing id (deterministic no-op)", () => {
		const state = retreat();
		expect(
			run(state, {
				type: "field/add",
				pageId: "support",
				fieldId: "name",
				fieldType: "email",
			}),
		).toBe(state);
	});

	it("keeps options when switching between choice types", () => {
		const next = run(retreat(), {
			type: "field/changeType",
			fieldId: "gender",
			fieldType: "multi_choice",
		});
		const gender = next.fields.find((f) => f.id === "gender");
		expect(gender?.type).toBe("multi_choice");
		expect(gender && "options" in gender ? gender.options.length : 0).toBe(2);
	});

	it("duplicates right after the source with a distinct sheet header", () => {
		const next = run(retreat(), {
			type: "field/duplicate",
			fieldId: "name",
			newId: "name_copy",
		});
		expect(next.pages[0]?.fieldIds.slice(0, 2)).toStrictEqual([
			"name",
			"name_copy",
		]);
		expect(parseFormDefinition(next).ok).toBe(true);
	});

	it("moves across a page boundary via moveTarget", () => {
		const state = retreat();
		const target = moveTarget(state, "stay_type", -1);
		expect(target).toStrictEqual({ pageId: "personal", index: 5 });
		const next = run(state, {
			type: "field/move",
			fieldId: "stay_type",
			...(target ?? { pageId: "", index: 0 }),
		});
		expect(next.pages[0]?.fieldIds.at(-1)).toBe("stay_type");
		expect(next.pages[1]?.fieldIds).not.toContain("stay_type");
		expect(moveTarget(state, "name", -1)).toBeNull();
	});

	it("adds options with unique values and respects the limit", () => {
		const next = run(retreat(), {
			type: "option/add",
			fieldId: "gender",
			labels: ["기타", "응답 안 함"],
		});
		const gender = next.fields.find((f) => f.id === "gender");
		const values =
			gender && "options" in gender ? gender.options.map((o) => o.value) : [];
		expect(new Set(values).size).toBe(4);
		const many = Array.from(
			{ length: DEFINITION_LIMITS.options + 5 },
			(_, i) => `#${i}`,
		);
		const capped = run(retreat(), {
			type: "option/add",
			fieldId: "gender",
			labels: many,
		});
		const g = capped.fields.find((f) => f.id === "gender");
		expect(g && "options" in g ? g.options.length : 0).toBe(
			DEFINITION_LIMITS.options,
		);
	});

	it("refuses to rename an option onto an existing value", () => {
		const state = retreat();
		expect(
			run(state, {
				type: "option/rename",
				fieldId: "gender",
				from: "male",
				to: "female",
			}),
		).toBe(state);
	});
});

describe("pages", () => {
	it("removing a page moves its questions to the previous page", () => {
		const next = run(retreat(), { type: "page/remove", pageId: "attendance" });
		expect(next.pages.map((p) => p.id)).toStrictEqual(["personal", "support"]);
		expect(next.pages[0]?.fieldIds.slice(-3)).toStrictEqual([
			"stay_type",
			"arrival_at",
			"arrival_note",
		]);
		expect(next.fields).toHaveLength(retreat().fields.length);
	});

	it("never removes the last page", () => {
		const one = run(
			retreat(),
			{ type: "page/remove", pageId: "attendance" },
			{ type: "page/remove", pageId: "support" },
		);
		expect(run(one, { type: "page/remove", pageId: "personal" })).toBe(one);
	});
});

describe("coupled settings", () => {
	it("turning SMS off clears notifications and preserves payment settings", () => {
		const next = run(retreat(), { type: "sms/set", phoneFieldId: null });
		expect(next.contact).toBeUndefined();
		expect(next.notifications).toBeUndefined();
		expect(next.payment).toStrictEqual(retreat().payment);
		expect(parseFormDefinition(next).ok).toBe(true);
	});

	it("disabling payment preserves signup and update notifications", () => {
		const next = run(retreat(), { type: "payment/set", enabled: false });
		expect(next.payment).toBeUndefined();
		expect(next.notifications).toStrictEqual(retreat().notifications);
		expect(parseFormDefinition(next).ok).toBe(true);
	});
});

describe("validation index", () => {
	it("routes issues to the field, page or settings section that shows them", () => {
		const broken = run(
			retreat(),
			{ type: "field/update", fieldId: "name", patch: { label: "" } },
			{ type: "page/update", pageId: "support", patch: { title: "" } },
			{ type: "payment/update", patch: { account: "" } },
		);
		const index = validateDefinition(broken);
		expect(index.byField.get("name")).toStrictEqual([
			"질문 제목: 질문 제목을 입력해주세요",
		]);
		expect(index.byPage.get("support")?.[0]).toContain(
			"페이지 제목을 입력해주세요",
		);
		expect(index.bySection.get("payment")?.[0]).toContain("입금 계좌");
		expect(index.questionCount).toBe(2);
		expect(index.total).toBe(3);
	});
});

describe(toEditable, () => {
	it("opens a structurally sound but invalid draft and fills type defaults", () => {
		const draft = {
			schemaVersion: 1,
			title: "",
			fields: [{ id: "a", type: "short_text", label: "" }],
			pages: [{ id: "p", title: "p", fieldIds: ["a"] }],
			identity: { fieldId: "a" },
		};
		const editable = toEditable(draft);
		expect(editable?.fields[0]).toMatchObject({
			maxLength: 200,
			required: false,
		});
	});

	it("rejects drafts whose structure cannot be edited", () => {
		expect(toEditable("{")).toBeNull();
		expect(
			toEditable({ fields: [{ id: "a", type: "nope" }], pages: [] }),
		).toBeNull();
	});
});
