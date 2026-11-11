import type { FormDefinition } from "../definition/definition";
import { PAID_LABELS } from "../definition/system-columns";
import type { SystemColumnKey } from "../definition/system-columns";
import { submittedAtText } from "./cells";
import type { ParsedSheetRow, SheetRecord, SheetWriteCell } from "./record";

/**
 * 운영 컬럼 셀 변환 표 (definition/system-columns.ts의 키마다 한 항목).
 * read는 셀 글자에서 읽은 값을 돌려주기만 한다. 값을 읽지 않는 컬럼(신청일시)은 read가 없다.
 */
interface SystemCellCodec {
	/** 드롭다운으로 고르는 값 (없으면 자유 입력) */
	choices?: readonly string[];
	read?: (text: string) => Partial<Pick<ParsedSheetRow, "id" | "paid">>;
	write: (record: SheetRecord, definition: FormDefinition) => SheetWriteCell;
}

export const SYSTEM_CELLS: Record<SystemColumnKey, SystemCellCodec> = {
	id: {
		write: (record) => record.id,
		read: (text) => ({ id: text }),
	},
	submittedAt: {
		write: (record, definition) =>
			submittedAtText(record.submittedAt, definition.timezone),
	},
	paid: {
		choices: [PAID_LABELS.true, PAID_LABELS.false],
		// paid가 없으면 null: 운영자가 시트에서 바꾼 납입 여부를 재제출이 덮어쓰지 않는다
		write: (record) =>
			record.paid === undefined
				? null
				: PAID_LABELS[record.paid ? "true" : "false"],
		read: (text) => ({ paid: text === PAID_LABELS.true }),
	},
};
