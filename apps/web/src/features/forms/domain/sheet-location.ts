import {
	MAX_SHEET_TITLE_LENGTH,
	parseSpreadsheetId,
	sameSheetTitle,
	sheetTitleProblem,
} from "@jwc/google/spreadsheet-ref";
import type { SheetTitleProblem } from "@jwc/google/spreadsheet-ref";

/**
 * 폼의 응답 시트 위치(스프레드시트 + 탭) 입력 해석. 순수 함수 (I/O 없음).
 * Google 형식(ID·주소·탭 이름 제한)은 @jwc/google/spreadsheet-ref가 알고, 여기는 이 앱의 정책만 둔다:
 * 빈 스프레드시트 = 기본 스프레드시트, 사용자에게 보일 문장, 두 위치가 같은지.
 */

export interface SheetLocation {
	/** null이면 기본 스프레드시트 */
	spreadsheetId: string | null;
	sheetName: string;
}

export type SheetLocationResult =
	| { ok: true; location: SheetLocation }
	| { ok: false; fieldErrors: Partial<Record<keyof SheetLocation, string>> };

export const SHEET_LOCATION_MESSAGES = {
	spreadsheetId:
		"스프레드시트 주소(URL) 또는 ID를 확인해주세요. 예: https://docs.google.com/spreadsheets/d/…/edit",
	sheetName: {
		empty: "시트 탭 이름을 입력해주세요",
		too_long: `시트 탭 이름은 ${MAX_SHEET_TITLE_LENGTH}자 이하로 입력해주세요`,
		control_character: "시트 탭 이름에 줄바꿈 같은 제어 문자를 쓸 수 없습니다",
	} satisfies Record<SheetTitleProblem, string>,
} as const;

/** 빈 값은 null(기본 스프레드시트), 알아볼 수 없으면 undefined */
function spreadsheetSetting(input: string): string | null | undefined {
	return input.trim() === "" ? null : parseSpreadsheetId(input);
}

export function parseSheetLocation(input: {
	spreadsheet: string;
	sheetName: string;
}): SheetLocationResult {
	const spreadsheetId = spreadsheetSetting(input.spreadsheet);
	const sheetName = input.sheetName.trim();
	const problem = sheetTitleProblem(sheetName);
	if (spreadsheetId !== undefined && problem === null) {
		return { ok: true, location: { spreadsheetId, sheetName } };
	}
	return {
		ok: false,
		fieldErrors: {
			...(spreadsheetId === undefined
				? { spreadsheetId: SHEET_LOCATION_MESSAGES.spreadsheetId }
				: {}),
			...(problem === null
				? {}
				: { sheetName: SHEET_LOCATION_MESSAGES.sheetName[problem] }),
		},
	};
}

/** 새 폼 탭 이름 후보 수 (base, base-2 … base-N) */
const MAX_SHEET_NAME_CANDIDATES = 20;

/** 탭 이름 후보: base, base-2, base-3 … (겹치면 다음 후보를 쓴다) */
export function sheetNameCandidates(base: string): string[] {
	return Array.from({ length: MAX_SHEET_NAME_CANDIDATES }, (_, index) =>
		index === 0 ? base : `${base}-${index + 1}`,
	);
}

/** 실제로 응답을 읽고 쓰는 곳. 기본 스프레드시트(null)를 실제 ID로 채운 값이라 그대로 비교할 수 있다 */
export interface ResponseSheet {
	spreadsheetId: string;
	sheetName: string;
}

/** 저장된 설정 → 실제 위치. null 해석은 이 함수 한 곳에서만 한다 */
export function resolveSheet(
	location: SheetLocation,
	defaultSpreadsheetId: string,
): ResponseSheet {
	return {
		spreadsheetId: location.spreadsheetId ?? defaultSpreadsheetId,
		sheetName: location.sheetName,
	};
}

/** 같은 탭인지. 탭 이름은 대소문자를 구분하지 않는다 (Google 규칙) */
export function isSameSheet(a: ResponseSheet, b: ResponseSheet): boolean {
	return (
		a.spreadsheetId === b.spreadsheetId &&
		sameSheetTitle(a.sheetName, b.sheetName)
	);
}

/**
 * 저장할 설정으로 정리: 기본 스프레드시트 ID를 직접 적었으면 null(기본)로 바꾼다.
 * 그래야 "기본"을 가리키는 설정이 한 가지 모양이 되어 DB 유니크 인덱스가 중복을 막는다.
 */
export function normalizeLocation(
	location: SheetLocation,
	defaultSpreadsheetId: string,
): SheetLocation {
	return location.spreadsheetId === defaultSpreadsheetId
		? { ...location, spreadsheetId: null }
		: location;
}
