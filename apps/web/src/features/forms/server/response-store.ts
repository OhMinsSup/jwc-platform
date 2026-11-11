import type { FormDefinition } from "@jwc/form-core/definition/definition";
import { bindSubmissionStore } from "@jwc/submission-store/bound";
import type { BoundSubmissionStore } from "@jwc/submission-store/bound";

import {
	defaultSpreadsheetId,
	submissionStore,
} from "../../../platform/server/runtime";
import { resolveSheet } from "../domain/sheet-location";
import type { ResponseSheet, SheetLocation } from "../domain/sheet-location";

/**
 * 폼의 응답 시트 경계. 저장된 설정(spreadsheetId null = 기본)을 여기서 한 번 실제 위치로 바꾸고,
 * 서비스는 그 위치에 묶인 저장소만 쓴다 (스프레드시트 선택과 탭 이름을 호출마다 다시 조립하지 않는다).
 */

export function responseSheetOf(location: SheetLocation): ResponseSheet {
	return resolveSheet(location, defaultSpreadsheetId());
}

export function responseStore(
	sheet: ResponseSheet,
	definition: FormDefinition,
): BoundSubmissionStore {
	return bindSubmissionStore(submissionStore(sheet.spreadsheetId), {
		collection: sheet.sheetName,
		definition,
	});
}
