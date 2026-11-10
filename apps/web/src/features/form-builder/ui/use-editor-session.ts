import type { FormDefinition } from "@jwc/form-core/definition/definition";
import type { LiveRegionHandle } from "@jwc/ui-patterns/components/live-region";
import { useBlocker } from "@tanstack/react-router";
import {
	useCallback,
	useDeferredValue,
	useEffect,
	useMemo,
	useState,
} from "react";
import type { RefObject } from "react";
import { useStore } from "zustand";

import { buildIndex } from "../model/derive";
import type { EditorIndex } from "../model/derive";
import { validateDefinition } from "../model/issues";
import type { IssueIndex } from "../model/issues";
import type { EditorActions } from "./editor-context";
import { createEditorStore } from "./editor-store";
import type { SaveState } from "./toolbar";

export type CommandOutcome =
	| { ok: true; message: string }
	| { ok: false; message: string };

const ID_KEY_SEPARATOR = ",";

/**
 * 내용(id 목록)이 같으면 처음 받은 배열을 계속 돌려준다.
 * 부모가 렌더마다 새 배열을 넘겨도 이 값에 의존하는 메모가 다시 만들어지지 않는다.
 * 내용이 바뀌면 렌더 중에 상태를 맞춘다 (React가 커밋 전에 바로 다시 렌더한다).
 */
function useStableIds(ids: readonly string[]): readonly string[] {
	const [stable, setStable] = useState(ids);
	if (
		stable !== ids &&
		stable.join(ID_KEY_SEPARATOR) !== ids.join(ID_KEY_SEPARATOR)
	) {
		setStable(ids);
	}
	return stable;
}

/**
 * 편집 상태 + 파생 데이터.
 * - 정의와 저장 스냅샷은 인스턴스별 store 하나 (액션 데이터 → 순수 리듀서)
 * - 인덱스는 정의가 바뀔 때 한 번, 검증은 useDeferredValue로 입력보다 늦게 한 번
 */
export function useEditorState(
	initial: FormDefinition,
	lockedFieldIds: readonly string[],
	/** 화면 낭독기 알림 영역. 마운트 전·해제 후(null)의 알림은 버린다 (알림 상태는 LiveRegion 안에만 있다) */
	announcer: RefObject<LiveRegionHandle | null>,
) {
	// oxlint-disable-next-line react/hook-use-state -- store는 마운트 동안 교체하지 않는다. useState로 인스턴스 수명을 보장한다.
	const [editor] = useState(() => createEditorStore(initial));
	const definition = useStore(editor.store, (state) => state.definition);
	const dirty = useStore(
		editor.store,
		(state) => state.definition !== state.saved,
	);

	const index: EditorIndex = useMemo(
		() => buildIndex(definition),
		[definition],
	);
	const deferred = useDeferredValue(definition);
	const issues: IssueIndex = useMemo(
		() => validateDefinition(deferred),
		[deferred],
	);

	// 잠긴 id의 "내용"이 바뀔 때만 actions를 새로 만든다 (Actions 컨텍스트는 마운트 동안 사실상 불변)
	const stableLockedIds = useStableIds(lockedFieldIds);
	const actions = useMemo<EditorActions>(
		() => ({
			dispatch: editor.dispatch,
			getDefinition: editor.getDefinition,
			announce: (message) => announcer.current?.announce(message),
			lockedFieldIds: new Set(stableLockedIds),
		}),
		[editor, announcer, stableLockedIds],
	);
	return {
		definition,
		dirty,
		getDefinition: editor.getDefinition,
		isDirty: editor.isDirty,
		setSaved: editor.setSaved,
		index,
		issues,
		actions,
	};
}

interface CommandDeps {
	getDefinition: () => FormDefinition;
	isDirty: () => boolean;
	markSaved: (definition: FormDefinition) => void;
	/** 발행 전 검증 실패 시 첫 오류로 안내 */
	onInvalid: (issues: IssueIndex) => void;
	onPublish: () => Promise<CommandOutcome>;
	onSave: (definition: FormDefinition) => Promise<CommandOutcome>;
}

/** 저장/발행 명령. 서버 호출 자체는 라우트가 주입한다 (부수효과는 경계에) */
export function useEditorCommands({
	getDefinition,
	isDirty,
	markSaved,
	onSave,
	onPublish,
	onInvalid,
}: CommandDeps) {
	const [busy, setBusy] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);

	const save = useCallback(async (): Promise<boolean> => {
		const snapshot = getDefinition();
		setBusy(true);
		const result = await onSave(snapshot);
		setBusy(false);
		setNotice(result.message);
		if (result.ok) {
			markSaved(snapshot);
		}
		return result.ok;
	}, [getDefinition, markSaved, onSave]);

	const ensureSaved = useCallback(
		async () => (isDirty() ? await save() : true),
		[isDirty, save],
	);

	const publish = useCallback(async () => {
		const fresh = validateDefinition(getDefinition());
		if (fresh.total > 0) {
			setNotice(
				`고칠 곳 ${fresh.total}건이 있어 발행할 수 없습니다. 첫 오류로 이동합니다.`,
			);
			onInvalid(fresh);
			return;
		}
		if (!(await ensureSaved())) {
			return;
		}
		setBusy(true);
		const result = await onPublish();
		setBusy(false);
		setNotice(result.message);
	}, [getDefinition, ensureSaved, onPublish, onInvalid]);

	return { busy, notice, save, ensureSaved, publish };
}

export function saveStateOf(busy: boolean, dirty: boolean): SaveState {
	if (busy) {
		return "saving";
	}
	return dirty ? "dirty" : "saved";
}

const SAVE_KEY = "s";

/** ⌘S / Ctrl+S → 초안 저장 (브라우저의 "페이지 저장"을 막는다) */
export function useSaveShortcut(
	save: () => Promise<boolean>,
	isDirty: () => boolean,
): void {
	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			if (
				(event.metaKey || event.ctrlKey) &&
				event.key.toLowerCase() === SAVE_KEY
			) {
				event.preventDefault();
				if (isDirty()) {
					// 결과(성공/실패)는 save가 notice로 알린다
					void save();
				}
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [save, isDirty]);
}

/** 저장하지 않은 변경이 있으면 앱 내 이동은 확인 창으로, 탭 닫기는 브라우저 경고로 막는다 */
export function useLeaveGuard(isDirty: () => boolean) {
	return useBlocker({
		shouldBlockFn: isDirty,
		enableBeforeUnload: isDirty,
		withResolver: true,
	});
}
