import type { JsonObject, TypeWithID } from "payload";
import * as R from "remeda";

// 문서 타입의 기본 요구사항을 정의하는 인터페이스
interface DocWithIdAndTimestamp extends TypeWithID {
	createdAt: string | Date;
	[key: string]: unknown; // 추가 필드를 허용
}

// 제네릭 타입으로 다양한 문서 타입을 받을 수 있게 함
export const mergedDocs = <T extends DocWithIdAndTimestamp>(
	docs: T[],
	doc: T
): T[] => {
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
		R.values<Record<string | number, T>>, // 객체를 배열로 변환
		R.sortBy((f) => new Date(f.createdAt).getTime()) // 타임스탬프 내림차순 정렬
	);
};
