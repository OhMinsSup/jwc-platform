/**
 * 응답 시트의 운영 컬럼 표. 운영 컬럼 하나 = 이 표의 행 하나 (헤더, 이전 이름, 배치, 조건).
 * 셀 값 변환은 sheet/system-cells.ts의 같은 키 항목이 맡는다 (키가 빠지면 타입 오류).
 *
 * 헤더 텍스트로 컬럼을 찾으므로 이름을 바꿀 때는 이전 이름을 legacyHeaders에 남겨 기존 시트를 계속 읽게 한다.
 */
export const SYSTEM_COLUMN_TABLE = [
	{
		key: "id",
		header: "ID",
		legacyHeaders: ["응답 ID"],
		placement: "start",
		requiresPayment: false,
	},
	{
		key: "submittedAt",
		header: "신청일시",
		legacyHeaders: ["제출일시"],
		placement: "start",
		requiresPayment: false,
	},
	{
		key: "paid",
		header: "납입여부",
		legacyHeaders: [],
		placement: "end",
		requiresPayment: true,
	},
] as const satisfies readonly SystemColumnRow[];

interface SystemColumnRow {
	header: string;
	key: string;
	legacyHeaders: readonly string[];
	/** 질문 열의 앞(start) 또는 뒤(end) */
	placement: "start" | "end";
	/** 결제(payment)가 있는 폼에만 둔다 */
	requiresPayment: boolean;
}

export type SystemColumn = (typeof SYSTEM_COLUMN_TABLE)[number];
export type SystemColumnKey = SystemColumn["key"];

/** 이전 버전이 만들었지만 더 이상 관리하지 않는 운영 컬럼. 값을 쓰지 않고 그대로 둔다 */
const RETIRED_SYSTEM_HEADERS = ["수정일시"] as const;

/**
 * 새로 편집·발행하는 정의에서 질문 헤더로 쓸 수 없는 이름 (현재·이전·폐기된 운영 컬럼).
 * 겹치면 기존 시트에서 엉뚱한 열을 읽는다.
 */
export const SYSTEM_COLUMN_HEADERS: readonly string[] = [
	...SYSTEM_COLUMN_TABLE.flatMap((column) => [
		column.header,
		...column.legacyHeaders,
	]),
	...RETIRED_SYSTEM_HEADERS,
];

/**
 * 이미 발행된 정의를 다시 읽을 때 막는 이름: ADR-0025 이전부터 예약돼 있던 것만.
 * 이후에 예약한 이름("ID", "신청일시")을 질문 헤더로 쓴 옛 정의도 계속 열리게 한다
 * (겹치면 시트에서는 운영 컬럼이 우선이고, 그 질문 열은 시트에 쓰이지 않는다).
 */
export const STORED_RESERVED_HEADERS: readonly string[] = [
	"응답 ID",
	"제출일시",
	"수정일시",
	"납입여부",
];

export function systemColumnOf(key: SystemColumnKey): SystemColumn {
	const column = SYSTEM_COLUMN_TABLE.find((row) => row.key === key);
	if (!column) {
		throw new Error(`알 수 없는 운영 컬럼: ${key}`);
	}
	return column;
}

export const PAID_LABELS = { true: "납입", false: "미납" } as const;
