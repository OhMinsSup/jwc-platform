// @vitest-environment jsdom
import type { FormDefinition } from "@jwc/form-core/definition/definition";
import { blankDefinition } from "@jwc/form-core/samples/blank";
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

import { createEditorStore } from "../src/features/form-builder/ui/editor-store";
import {
	useEditorCommands,
	useEditorState,
	useSaveShortcut,
} from "../src/features/form-builder/ui/use-editor-session";
import type { CommandOutcome } from "../src/features/form-builder/ui/use-editor-session";

interface HarnessProps {
	initial: FormDefinition;
	onSave: (definition: FormDefinition) => Promise<CommandOutcome>;
}

function Harness({ initial, onSave }: HarnessProps) {
	const session = useEditorState(initial, []);
	const commands = useEditorCommands({
		...session,
		markSaved: session.setSaved,
		onSave,
		onPublish: () => Promise.resolve({ ok: true, message: "발행" }),
		onInvalid: () => {
			throw new Error("이 테스트는 발행하지 않습니다");
		},
	});
	useSaveShortcut(commands.save, session.isDirty);
	const edit = (title: string) =>
		session.actions.dispatch({ type: "meta/update", patch: { title } });
	return createElement(
		"div",
		null,
		createElement("output", null, session.dirty ? "미저장" : "저장됨"),
		createElement("button", { onClick: () => edit("수정") }, "편집"),
		createElement("button", { onClick: () => edit("추가 수정") }, "추가 편집"),
		createElement(
			"button",
			{
				onClick: () => {
					void commands.save();
				},
			},
			"저장",
		),
		createElement(
			"button",
			{
				onClick: () => {
					edit("같은 이벤트의 수정");
					void commands.save();
				},
			},
			"편집하고 저장",
		),
	);
}

const initial = blankDefinition("초기 제목");
const onSave = vi.fn<HarnessProps["onSave"]>();
let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;

async function flush(run: () => void) {
	await act(async () => {
		run();
		await Promise.resolve();
	});
}

async function click(label: string) {
	const button = [...container.querySelectorAll("button")].find(
		(element) => element.textContent === label,
	);
	if (!button) {
		throw new Error(`버튼이 없습니다: ${label}`);
	}
	await flush(() => button.click());
}

function shortcut() {
	return new KeyboardEvent("keydown", {
		key: "s",
		ctrlKey: true,
		cancelable: true,
	});
}

describe("편집·저장 세션", () => {
	beforeEach(async () => {
		vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
		onSave.mockReset().mockResolvedValue({ ok: true, message: "저장 성공" });
		container = document.createElement("div");
		// oxlint-disable-next-line unicorn/prefer-modern-dom-apis -- Workers의 HTMLRewriter.append와 DOM 타입 충돌을 피한다.
		document.body.insertAdjacentElement("beforeend", container);
		root = createRoot(container);
		await flush(() => root.render(createElement(Harness, { initial, onSave })));
	});

	afterEach(async () => {
		await flush(() => root.unmount());
		container.remove();
		vi.unstubAllGlobals();
	});

	it("서로 다른 편집기의 변경과 저장 상태를 공유하지 않는다", () => {
		const first = createEditorStore(initial);
		const second = createEditorStore(initial);
		first.dispatch({ type: "meta/update", patch: { title: "첫 편집기" } });
		expect(first.isDirty()).toBe(true);
		expect(second.getDefinition()).toBe(initial);
		expect(second.isDirty()).toBe(false);
		first.setSaved(first.getDefinition());
		expect(first.isDirty()).toBe(false);
		expect(second.getDefinition().title).toBe("초기 제목");
	});

	it("같은 이벤트에서 편집하고 저장해도 최신 정의를 보낸다", async () => {
		await click("편집하고 저장");
		expect(onSave).toHaveBeenCalledWith(
			expect.objectContaining({ title: "같은 이벤트의 수정" }),
		);
		expect(container.querySelector("output")?.textContent).toBe("저장됨");
	});

	it("저장이 실패하면 미저장 상태를 유지한다", async () => {
		onSave.mockResolvedValue({ ok: false, message: "저장 실패" });
		await click("편집");
		await click("저장");
		expect(container.querySelector("output")?.textContent).toBe("미저장");
	});

	it("저장 응답을 기다리며 추가한 편집은 미저장으로 남는다", async () => {
		const response = { complete: () => {} };
		// oxlint-disable-next-line promise/avoid-new -- 외부 저장 응답의 완료 시점을 테스트가 결정한다.
		const pending = new Promise<CommandOutcome>((resolve) => {
			response.complete = () => resolve({ ok: true, message: "저장 성공" });
		});
		onSave.mockReturnValue(pending);
		await click("편집");
		await click("저장");
		await click("추가 편집");
		await flush(response.complete);
		expect(onSave).toHaveBeenCalledWith(
			expect.objectContaining({ title: "수정" }),
		);
		expect(container.querySelector("output")?.textContent).toBe("미저장");
		await click("저장");
		expect(onSave).toHaveBeenLastCalledWith(
			expect.objectContaining({ title: "추가 수정" }),
		);
		expect(container.querySelector("output")?.textContent).toBe("저장됨");
	});

	it("저장 단축키는 미저장 변경만 저장하고 브라우저 기본 동작을 막는다", async () => {
		await click("편집");
		const event = shortcut();
		await flush(() => {
			window.dispatchEvent(event);
		});
		expect(event.defaultPrevented).toBe(true);
		expect(onSave).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ title: "수정" }),
		);
		await flush(() => {
			window.dispatchEvent(shortcut());
		});
		expect(onSave).toHaveBeenCalledOnce();
	});
});
