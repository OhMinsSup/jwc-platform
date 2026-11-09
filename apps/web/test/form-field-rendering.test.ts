// @vitest-environment jsdom
import type { FieldDef } from "@jwc/form-core/definition/fields";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vite-plus/test";

import { DraftField } from "../src/features/form-engine/field-view";
import type { FieldProps } from "../src/features/form-engine/fields/types";
import { useDraft, useDraftStore } from "../src/features/form-engine/store";

const renderField = vi.hoisted(() => vi.fn<(id: string) => void>());
vi.mock(
	import("../src/features/form-engine/fields/registry"),
	async (importOriginal) => {
		const original = await importOriginal();
		return {
			FIELD_RENDERERS: {
				...original.FIELD_RENDERERS,
				short_text: ({ field, value, inputId }: FieldProps) => {
					renderField(field.id);
					return createElement("input", {
						id: inputId,
						value: typeof value === "string" ? value : "",
						readOnly: true,
					});
				},
			},
		};
	},
);

const SLUG = "render-test";
const fields: FieldDef[] = Array.from({ length: 200 }, (_, index) => ({
	id: `question_${index}`,
	type: "short_text",
	label: `질문 ${index}`,
	required: false,
	maxLength: 200,
}));

function Questions() {
	const answers = useDraft(SLUG);
	return createElement(
		"div",
		{ "data-answered": Object.keys(answers).length },
		fields.map((field) =>
			createElement(DraftField, {
				key: field.id,
				field,
				slug: SLUG,
				error: undefined,
			}),
		),
	);
}

async function flush(run: () => void) {
	await act(async () => {
		run();
		await Promise.resolve();
	});
}

describe("공개 폼 질문 렌더링", () => {
	let root: ReturnType<typeof createRoot>;
	let container: HTMLDivElement;
	beforeEach(async () => {
		vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
		useDraftStore.getState().clear(SLUG);
		container = document.createElement("div");
		root = createRoot(container);
		await flush(() => root.render(createElement(Questions)));
		renderField.mockClear();
	});
	afterEach(async () => {
		await flush(() => root.unmount());
		useDraftStore.getState().clear(SLUG);
		vi.unstubAllGlobals();
	});

	it("한 답변을 바꿔도 독립적인 다른 질문은 다시 그리지 않는다", async () => {
		await flush(() =>
			useDraftStore.getState().setAnswer(SLUG, "question_0", "수정"),
		);
		expect(container.querySelector("input")?.value).toBe("수정");
		expect(container.querySelectorAll("input")).toHaveLength(200);
		expect(
			container.querySelector<HTMLDivElement>("[data-answered]")?.dataset
				.answered,
		).toBe("1");
		expect(renderField).toHaveBeenCalledExactlyOnceWith("question_0");
	});
});
