import type { FormDefinition } from "@jwc/form-core/definition/definition";

import type { EditorAction } from "./actions";
import { FIELD_HANDLERS } from "./reducer-fields";
import { PAGE_HANDLERS } from "./reducer-pages";
import { SETTINGS_HANDLERS } from "./reducer-settings";

/** action.type → 그 type의 액션 데이터 */
type ActionOf = { [A in EditorAction as A["type"]]: A };
type ActionType = keyof ActionOf;
type HandlerTable = {
	[K in ActionType]: (
		state: FormDefinition,
		action: ActionOf[K],
	) => FormDefinition;
};

/** action.type → 핸들러. switch 대신 테이블 조회 (새 액션 = 항목 하나 추가) */
const HANDLERS: HandlerTable = {
	...FIELD_HANDLERS,
	...PAGE_HANDLERS,
	...SETTINGS_HANDLERS,
};

/** type과 액션을 같은 K로 묶어 테이블의 핸들러와 액션 타입이 서로 맞음을 컴파일러가 확인하게 한다 */
function runHandler<K extends ActionType>(
	state: FormDefinition,
	type: K,
	action: ActionOf[K],
): FormDefinition {
	return HANDLERS[type](state, action);
}

/**
 * 편집기 상태 = 폼 정의 그 자체 (별도 편집용 표현 없음).
 * 저장 시 변환 단계가 없으므로 "화면에 보이는 것 = 저장되는 것"이 항상 성립한다.
 */
export function editorReducer(
	state: FormDefinition,
	action: EditorAction,
): FormDefinition {
	return runHandler(state, action.type, action);
}
