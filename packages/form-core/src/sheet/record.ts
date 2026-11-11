import type { Answers } from "../answers/value";

/** 시트 1행에 해당하는 레코드. 타임스탬프는 epoch ms. */
export interface SheetRecord {
	answers: Answers;
	id: string;
	/** undefined면 쓰지 않는다(기존 셀 보존). 재제출이 운영자가 바꾼 납입 여부를 덮어쓰지 않게 한다 */
	paid?: boolean;
	submittedAt: number;
}

/** 시트에서 읽은 레코드 */
export interface ParsedSheetRow {
	answers: Answers;
	/** 해석하지 못한 셀: header → 이유 */
	errors: Record<string, string>;
	id: string;
	paid: boolean;
}

/** 쓸 셀. null은 "이 칸은 건드리지 않는다" */
export type SheetWriteCell = string | number | null;
