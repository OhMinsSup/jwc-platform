import { DEFINITION_LIMITS } from "@jwc/form-core";
import type { FormDefinition, PageDef } from "@jwc/form-core";

import type { PageAction } from "./actions";
import { moveItem } from "./collections";

const UNTITLED_PAGE = "새 페이지";

type State = FormDefinition;
type Handler<T extends PageAction["type"]> = (
	state: State,
	action: Extract<PageAction, { type: T }>,
) => State;
export type PageHandlers = { [T in PageAction["type"]]: Handler<T> };

/**
 * 페이지 삭제: 질문은 지우지 않고 이웃 페이지로 옮긴다 (데이터 손실 방지).
 * 이전 페이지가 있으면 그 끝에, 없으면 다음 페이지 앞에 붙인다.
 */
const removePage: Handler<"page/remove"> = (state, { pageId }) => {
	const index = state.pages.findIndex((page) => page.id === pageId);
	const removed = state.pages[index];
	if (!removed || state.pages.length <= 1) {
		return state;
	}
	const targetIndex = index > 0 ? index - 1 : index + 1;
	const pages = state.pages.map((page, i): PageDef => {
		if (i !== targetIndex) {
			return page;
		}
		const fieldIds =
			targetIndex < index
				? [...page.fieldIds, ...removed.fieldIds]
				: [...removed.fieldIds, ...page.fieldIds];
		return { ...page, fieldIds };
	});
	return { ...state, pages: pages.filter((page) => page.id !== pageId) };
};

export const PAGE_HANDLERS: PageHandlers = {
	"page/add": (state, { pageId }) =>
		state.pages.length >= DEFINITION_LIMITS.pages ||
		state.pages.some((page) => page.id === pageId)
			? state
			: {
					...state,
					pages: [
						...state.pages,
						{ id: pageId, title: UNTITLED_PAGE, fieldIds: [] },
					],
				},
	"page/update": (state, { pageId, patch }) => ({
		...state,
		pages: state.pages.map((page) =>
			page.id === pageId ? { ...page, ...patch } : page,
		),
	}),
	"page/remove": removePage,
	"page/move": (state, { pageId, delta }) => {
		const from = state.pages.findIndex((page) => page.id === pageId);
		const pages = moveItem(state.pages, from, from + delta);
		return pages === state.pages ? state : { ...state, pages };
	},
};
