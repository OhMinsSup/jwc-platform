import type { FormDefinition } from "@jwc/form-core/definition/definition";
import { createContext, useContext } from "react";

import type { EditorDispatch } from "../model/actions";
import type { EditorIndex } from "../model/derive";
import type { IssueIndex } from "../model/issues";

/**
 * 컨텍스트를 변경 빈도별로 나눈다.
 * - Actions: 마운트 동안 불변 (dispatch, 최신 상태 읽기, 알림) → 구독해도 리렌더 없음
 * - Index: 질문/페이지 구조가 바뀔 때만
 * - Issues: 검증이 끝날 때만 (useDeferredValue로 입력보다 늦게)
 */
export interface EditorActions {
	/** 스크린리더 알림 (aria-live) */
	announce: (message: string) => void;
	dispatch: EditorDispatch;
	/** 이벤트 핸들러에서 최신 정의를 읽는다 (렌더 중에는 쓰지 않는다) */
	getDefinition: () => FormDefinition;
	lockedFieldIds: ReadonlySet<string>;
}

const ActionsContext = createContext<EditorActions | null>(null);
const IndexContext = createContext<EditorIndex | null>(null);
const IssuesContext = createContext<IssueIndex | null>(null);

export const EditorActionsProvider = ActionsContext.Provider;
export const EditorIndexProvider = IndexContext.Provider;
export const EditorIssuesProvider = IssuesContext.Provider;

function required<T>(value: T | null, name: string): T {
	if (value === null) {
		throw new Error(`${name} must be used inside <FormBuilder>`);
	}
	return value;
}

export function useEditorActions(): EditorActions {
	return required(useContext(ActionsContext), "useEditorActions");
}

export function useEditorIndex(): EditorIndex {
	return required(useContext(IndexContext), "useEditorIndex");
}

export function useEditorIssues(): IssueIndex {
	return required(useContext(IssuesContext), "useEditorIssues");
}
