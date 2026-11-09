import type { FormDefinition } from "@jwc/form-core/definition/definition";
import { createStore } from "zustand/vanilla";

import type { EditorAction } from "../model/actions";
import { editorReducer } from "../model/reducer";

/** 편집기 인스턴스의 원본. React 구독과 이벤트 명령이 같은 스냅샷을 읽는다. */
export function createEditorStore(initial: FormDefinition) {
	const store = createStore(() => ({ definition: initial, saved: initial }));
	return {
		store,
		dispatch: (action: EditorAction) =>
			store.setState((state) => ({
				definition: editorReducer(state.definition, action),
			})),
		getDefinition: () => store.getState().definition,
		isDirty: () => {
			const { definition, saved } = store.getState();
			return definition !== saved;
		},
		setSaved: (saved: FormDefinition) => store.setState({ saved }),
	};
}
