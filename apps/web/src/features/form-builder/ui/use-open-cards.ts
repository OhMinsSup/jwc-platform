import { useCallback, useMemo, useState } from "react";

/** 펼친 질문 카드 집합 + "방금 추가해서 포커스할 카드". 콜백은 모두 안정적이다. */
export interface OpenCards {
	focusId: string | null;
	openIds: ReadonlySet<string>;
	/** 펼치고 (선택적으로) 제목 칸에 포커스 */
	reveal: (fieldId: string, focus: boolean) => void;
	setAll: (fieldIds: readonly string[]) => void;
	toggle: (fieldId: string) => void;
}

export function useOpenCards(): OpenCards {
	const [openIds, setOpenIds] = useState<ReadonlySet<string>>(() => new Set());
	const [focusId, setFocusId] = useState<string | null>(null);

	const toggle = useCallback((fieldId: string) => {
		setFocusId(null);
		setOpenIds((current) => {
			const next = new Set(current);
			if (!next.delete(fieldId)) {
				next.add(fieldId);
			}
			return next;
		});
	}, []);

	const reveal = useCallback((fieldId: string, focus: boolean) => {
		setOpenIds((current) =>
			current.has(fieldId) ? current : new Set(current).add(fieldId),
		);
		setFocusId(focus ? fieldId : null);
	}, []);

	const setAll = useCallback((fieldIds: readonly string[]) => {
		setFocusId(null);
		setOpenIds(new Set(fieldIds));
	}, []);

	return useMemo(
		() => ({ openIds, focusId, toggle, reveal, setAll }),
		[openIds, focusId, toggle, reveal, setAll],
	);
}
