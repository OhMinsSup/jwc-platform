import { ConflictError } from "../../../platform/server/errors/conflict-error";
import { InvalidInputError } from "../../../platform/server/errors/invalid-input-error";
import { log } from "../../../platform/server/log";
import { defaultSpreadsheetId } from "../../../platform/server/runtime";
import {
	normalizeLocation,
	parseSheetLocation,
} from "../domain/sheet-location";
import type { SheetLocation } from "../domain/sheet-location";
import { prepareStore, requireForm } from "./admin-forms";
import { publishedFormById } from "./definitions";
import { updateSheetLocation } from "./forms-repository";
import { responseSheetOf, responseStore } from "./response-store";
import {
	assertSheetAvailable,
	SHEET_TAKEN_MESSAGE,
} from "./sheet-availability";

/**
 * 폼의 응답 시트 위치(스프레드시트 + 탭) 변경.
 * 이미 받은 응답은 옮기지 않는다: 바꾼 뒤의 제출·목록·납입 변경은 새 위치를 쓴다 (화면에서 안내).
 */
export async function changeSheetLocation(
	formId: string,
	input: { spreadsheet: string; sheetName: string },
	now: number,
): Promise<SheetLocation> {
	const parsed = parseSheetLocation(input);
	if (!parsed.ok) {
		throw new InvalidInputError("시트 설정을 확인해주세요", parsed.fieldErrors);
	}
	const location = normalizeLocation(parsed.location, defaultSpreadsheetId());
	const sheet = responseSheetOf(location);
	const form = await requireForm(formId);
	await assertSheetAvailable(sheet, form.id);
	// 발행된 폼은 저장하기 전에 새 위치를 준비해 본다: 권한이 없으면 여기서 알려 주고 설정은 그대로 둔다
	if (form.publishedVersionId) {
		const { definition } = await publishedFormById(form.id);
		await prepareStore(responseStore(sheet, definition));
	}
	// 검사와 저장 사이에 다른 관리자가 같은 탭을 저장했으면 DB 유니크 인덱스가 막는다
	const outcome = await updateSheetLocation(form.id, location, now);
	if (outcome === "taken") {
		throw new ConflictError(SHEET_TAKEN_MESSAGE);
	}
	log.info("form.sheet_changed", {
		formId: form.id,
		customSpreadsheet: location.spreadsheetId !== null,
	});
	return location;
}
