import type { Answers, AnswerValue } from "@jwc/form-core";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * 작성 중인 답변. 폼(slug)별 Answers 하나만 둔다 — 스텝별 슬라이스/파생 상태를 저장하지 않는다.
 * 탭을 닫으면 사라지도록 sessionStorage를 쓴다 (개인정보를 오래 남기지 않기 위함).
 */
/** 답 하나를 바꾼 새 Answers. undefined면 그 답을 지운다 (기존 키 순서 유지) */
function withAnswer(
	answers: Answers | undefined,
	fieldId: string,
	value: AnswerValue | undefined,
): Answers {
	if (value === undefined) {
		const { [fieldId]: _removed, ...rest } = answers ?? {};
		return rest;
	}
	return { ...answers, [fieldId]: value };
}

interface DraftStore {
	clear: (slug: string) => void;
	drafts: Record<string, Answers>;
	setAnswer: (
		slug: string,
		fieldId: string,
		value: AnswerValue | undefined,
	) => void;
}

export const useDraftStore = create<DraftStore>()(
	persist(
		(set) => ({
			drafts: {},
			setAnswer: (slug, fieldId, value) =>
				set((state) => ({
					drafts: {
						...state.drafts,
						[slug]: withAnswer(state.drafts[slug], fieldId, value),
					},
				})),
			clear: (slug) =>
				set((state) => {
					const { [slug]: _removed, ...rest } = state.drafts;
					return { drafts: rest };
				}),
		}),
		{
			name: "jwc-form-drafts",
			storage: createJSONStorage(() => sessionStorage),
		},
	),
);

const EMPTY: Answers = {};

export function useDraft(slug: string): Answers {
	return useDraftStore((state) => state.drafts[slug] ?? EMPTY);
}
