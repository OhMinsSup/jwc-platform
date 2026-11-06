import type { FormDefinition } from "@jwc/form-core/definition/definition";
import { useBlocker } from "@tanstack/react-router";
import {
	useCallback,
	useDeferredValue,
	useEffect,
	useMemo,
	useReducer,
	useRef,
	useState,
} from "react";
import type { RefObject } from "react";

import { buildIndex } from "../model/derive";
import type { EditorIndex } from "../model/derive";
import { validateDefinition } from "../model/issues";
import type { IssueIndex } from "../model/issues";
import { editorReducer } from "../model/reducer";
import type { EditorActions } from "./editor-context";
import type { SaveState } from "./toolbar";

export type CommandOutcome =
	| { ok: true; message: string }
	| { ok: false; message: string };

/** LiveRegion이 등록한 알림 함수를 보관 (알림 상태는 LiveRegion 안에만 있다) */
function useAnnouncer() {
	const announceRef = useRef<(message: string) => void>(() => {
		// LiveRegion이 등록되기 전의 알림은 버린다
	});
	const registerAnnouncer = useCallback((fn: (message: string) => void) => {
		announceRef.current = fn;
	}, []);
	return { announceRef, registerAnnouncer };
}

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
 * - 정의는 useReducer 하나 (액션 데이터 → 순수 리듀서)
 * - 인덱스는 정의가 바뀔 때 한 번, 검증은 useDeferredValue로 입력보다 늦게 한 번
 */
export function useEditorState(
	initial: FormDefinition,
	lockedFieldIds: readonly string[],
) {
	const [definition, dispatch] = useReducer(editorReducer, initial);
	const [saved, setSaved] = useState(initial);
	const latest = useRef(definition);
	const dirty = definition !== saved;
	const dirtyRef = useRef(dirty);
	useEffect(() => {
		latest.current = definition;
		dirtyRef.current = dirty;
	}, [definition, dirty]);

	const index: EditorIndex = useMemo(
		() => buildIndex(definition),
		[definition],
	);
	const deferred = useDeferredValue(definition);
	const issues: IssueIndex = useMemo(
		() => validateDefinition(deferred),
		[deferred],
	);

	const { announceRef, registerAnnouncer } = useAnnouncer();
	// 잠긴 id의 "내용"이 바뀔 때만 actions를 새로 만든다 (Actions 컨텍스트는 마운트 동안 사실상 불변)
	const stableLockedIds = useStableIds(lockedFieldIds);
	const actions = useMemo<EditorActions>(
		() => ({
			dispatch,
			getDefinition: () => latest.current,
			announce: (message) => announceRef.current(message),
			lockedFieldIds: new Set(stableLockedIds),
		}),
		[announceRef, stableLockedIds],
	);
	return {
		definition,
		dirty,
		dirtyRef,
		latest,
		setSaved,
		index,
		issues,
		actions,
		registerAnnouncer,
	};
}

interface CommandDeps {
	dirtyRef: RefObject<boolean>;
	latest: RefObject<FormDefinition>;
	markSaved: (definition: FormDefinition) => void;
	/** 발행 전 검증 실패 시 첫 오류로 안내 */
	onInvalid: (issues: IssueIndex) => void;
	onPublish: () => Promise<CommandOutcome>;
	onSave: (definition: FormDefinition) => Promise<CommandOutcome>;
}

/** 저장/발행 명령. 서버 호출 자체는 라우트가 주입한다 (부수효과는 경계에) */
export function useEditorCommands({
	latest,
	dirtyRef,
	markSaved,
	onSave,
	onPublish,
	onInvalid,
}: CommandDeps) {
	const [busy, setBusy] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);

	const save = useCallback(async (): Promise<boolean> => {
		const snapshot = latest.current;
		setBusy(true);
		const result = await onSave(snapshot);
		setBusy(false);
		setNotice(result.message);
		if (result.ok) {
			markSaved(snapshot);
			// 렌더를 기다리지 않고 즉시 반영: 저장 직후 이동(미리보기)이 이탈 경고에 걸리지 않게
			dirtyRef.current = latest.current !== snapshot;
		}
		return result.ok;
	}, [latest, dirtyRef, markSaved, onSave]);

	const ensureSaved = useCallback(
		async () => (dirtyRef.current ? await save() : true),
		[dirtyRef, save],
	);

	const publish = useCallback(async () => {
		const fresh = validateDefinition(latest.current);
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
	}, [latest, ensureSaved, onPublish, onInvalid]);

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
	dirtyRef: RefObject<boolean>,
): void {
	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			if (
				(event.metaKey || event.ctrlKey) &&
				event.key.toLowerCase() === SAVE_KEY
			) {
				event.preventDefault();
				if (dirtyRef.current) {
					// 결과(성공/실패)는 save가 notice로 알린다
					void save();
				}
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [save, dirtyRef]);
}

/** 저장하지 않은 변경이 있으면 앱 내 이동은 확인 창으로, 탭 닫기는 브라우저 경고로 막는다 */
export function useLeaveGuard(dirtyRef: RefObject<boolean>) {
	return useBlocker({
		shouldBlockFn: () => dirtyRef.current,
		enableBeforeUnload: () => dirtyRef.current,
		withResolver: true,
	});
}
