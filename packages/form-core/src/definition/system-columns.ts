/** 운영 컬럼 키와 시트 배치 순서 */
export const SYSTEM_COLUMN_KEYS = [
	"id",
	"submittedAt",
	"updatedAt",
	"paid",
] as const;

export type SystemColumnKey = (typeof SYSTEM_COLUMN_KEYS)[number];

/**
 * 모든 응답 시트의 앞쪽에 위치하는 운영 컬럼.
 * 헤더 문자열은 Apps Script 웹훅과의 프로토콜이므로 변경 시 기존 시트 호환을 깨뜨린다.
 * satisfies로 SYSTEM_COLUMN_KEYS와 키 집합이 어긋나면 타입 오류가 난다.
 */
export const SYSTEM_COLUMNS = {
	id: "응답 ID",
	submittedAt: "제출일시",
	updatedAt: "수정일시",
	paid: "납입여부",
} as const satisfies Record<SystemColumnKey, string>;

export const SYSTEM_COLUMN_HEADERS: readonly string[] =
	Object.values(SYSTEM_COLUMNS);

export const PAID_LABELS = { true: "납입", false: "미납" } as const;
