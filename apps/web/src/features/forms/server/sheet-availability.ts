import { ConflictError } from "../../../platform/server/errors/conflict-error";
import { isSameSheet, sheetNameCandidates } from "../domain/sheet-location";
import type { ResponseSheet } from "../domain/sheet-location";
import { listFormsBySheetName } from "./forms-repository";
import { responseSheetOf } from "./response-store";

export const SHEET_TAKEN_MESSAGE =
	"다른 폼이 이미 이 스프레드시트의 같은 탭을 쓰고 있습니다. 탭 이름을 바꿔주세요";

const NO_FREE_SHEET_MESSAGE =
	"이 주소로 쓸 수 있는 시트 탭 이름이 없습니다. 다른 주소를 써주세요";

/** 다른 폼이 같은 탭(대소문자 무시)을 쓰는지 */
async function isSheetTaken(
	sheet: ResponseSheet,
	formId: string | null,
): Promise<boolean> {
	const sameName = await listFormsBySheetName(sheet.sheetName);
	return sameName.some(
		(other) =>
			other.id !== formId && isSameSheet(responseSheetOf(other), sheet),
	);
}

/** 다른 폼이 같은 탭을 쓰면 거절한다 (두 폼의 응답이 한 탭에 섞이지 않게) */
export async function assertSheetAvailable(
	sheet: ResponseSheet,
	formId: string | null,
): Promise<void> {
	if (await isSheetTaken(sheet, formId)) {
		throw new ConflictError(SHEET_TAKEN_MESSAGE);
	}
}

/**
 * 새 폼의 탭 이름: 기본 스프레드시트에서 아직 쓰지 않은 첫 이름 (base, base-2, base-3 …).
 * 만들기 화면에는 탭 이름 칸이 없으므로 겹친다고 거절하지 않고 번호를 붙인다 (설정에서 바꿀 수 있다).
 */
export async function firstFreeSheetName(base: string): Promise<string> {
	for (const candidate of sheetNameCandidates(base)) {
		// oxlint-disable-next-line no-await-in-loop -- 앞 후보가 쓰이고 있을 때만 다음 후보를 확인한다 (보통 첫 후보에서 끝난다)
		const taken = await isSheetTaken(
			responseSheetOf({ spreadsheetId: null, sheetName: candidate }),
			null,
		);
		if (!taken) {
			return candidate;
		}
	}
	throw new ConflictError(NO_FREE_SHEET_MESSAGE);
}
