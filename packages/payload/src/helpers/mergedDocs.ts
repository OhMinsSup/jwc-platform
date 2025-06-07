import * as R from "remeda";
import type { Form } from "../types";

export const mergedDocs = (docs: Form[], doc: Form) => {
	// id가 같은 항목이 있으면 값이 다를 때만 교체, 없으면 추가
	return R.pipe(
		docs,
		R.mapToObj((f) => [f.id, f]),
		(obj) => {
			const prev = obj[doc.id];
			if (!prev) {
				obj[doc.id] = doc; // id 없으면 추가
			} else if (!R.isDeepEqual(prev, doc)) {
				obj[doc.id] = doc; // 값 다르면 업데이트
			}
			// 값이 같으면 아무것도 안 함
			return obj;
		},
		R.values<Record<number, Form>>, // 객체를 배열로 변환
		R.sortBy((f) => new Date(f.createdAt).getTime()) // 타임스탬프 내림차순 정렬
	);
};
