// @vitest-environment jsdom
import type { FieldDef } from "@jwc/form-core/definition/fields";
import { blankDefinition } from "@jwc/form-core/samples/blank";
import { act, createElement, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vite-plus/test";

import { buildIndex } from "../src/features/form-builder/model/derive";
import {
	EditorActionsProvider,
	EditorIndexProvider,
} from "../src/features/form-builder/ui/editor-context";
import type { EditorActions } from "../src/features/form-builder/ui/editor-context";
import { FieldEditor } from "../src/features/form-builder/ui/field-editor";

const definition = blankDefinition("테스트 폼");
const index = buildIndex(definition);
const actions: EditorActions = {
	dispatch: vi.fn<EditorActions["dispatch"]>(),
	getDefinition: () => definition,
	announce: vi.fn<EditorActions["announce"]>(),
	lockedFieldIds: new Set(),
};
const field: FieldDef = {
	id: "question",
	type: "short_text",
	label: "새 질문",
	required: false,
	maxLength: 200,
};
let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;

async function flush(run: () => void) {
	await act(async () => {
		run();
		await Promise.resolve();
	});
}

async function renderEditor(focusOnMount: boolean, label = field.label) {
	await flush(() =>
		root.render(
			createElement(
				StrictMode,
				null,
				createElement(
					EditorActionsProvider,
					{ value: actions },
					createElement(
						EditorIndexProvider,
						{ value: index },
						createElement(FieldEditor, {
							field: { ...field, label },
							focusOnMount,
						}),
					),
				),
			),
		),
	);
	const input = container.querySelector("input");
	if (!input) {
		throw new Error("제목 입력이 없습니다");
	}
	return input;
}

describe("질문 제목 선택", () => {
	beforeEach(() => {
		vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
		container = document.createElement("div");
		// oxlint-disable-next-line unicorn/prefer-modern-dom-apis -- Workers의 HTMLRewriter.append와 DOM 타입 충돌을 피한다.
		document.body.insertAdjacentElement("beforeend", container);
		root = createRoot(container);
	});

	afterEach(async () => {
		await flush(() => root.unmount());
		container.remove();
		vi.unstubAllGlobals();
	});

	it("새 질문의 제목을 연결할 때 전체 선택한다", async () => {
		const input = await renderEditor(true);
		expect(input.selectionStart).toBe(0);
		expect(input.selectionEnd).toBe(field.label.length);
	});

	it("기존 질문을 펼치면 제목을 자동 선택하지 않는다", async () => {
		const input = await renderEditor(false);
		expect(input.selectionStart).toBe(input.selectionEnd);
	});

	it("새 props로 다시 렌더해도 커서 위치를 덮어쓰지 않는다", async () => {
		const input = await renderEditor(true);
		input.setSelectionRange(1, 1);
		await renderEditor(true);
		expect(input.selectionStart).toBe(1);
		expect(input.selectionEnd).toBe(1);
	});
});
