/**
 * Google 스프레드시트 참조 규칙 (순수 함수). 스프레드시트 ID·주소 형식과 탭 이름 제한은 Google이 정한 것이라
 * 앱이 아니라 여기에 둔다. 사용자에게 보일 문장은 앱이 문제 종류(SheetTitleProblem)를 보고 정한다.
 */

/** 스프레드시트 ID: 영문·숫자·-·_ (실제 ID는 44자 안팎) */
const SPREADSHEET_ID = /^[A-Za-z0-9_-]{20,100}$/u;
/** https://docs.google.com/spreadsheets/d/<ID>/edit?gid=0#gid=0 */
const SPREADSHEET_URL = /\/spreadsheets\/d\/(?<id>[A-Za-z0-9_-]+)/u;
const EDIT_URL_BASE = "https://docs.google.com/spreadsheets/d";

/** 탭 이름 최대 길이 */
export const MAX_SHEET_TITLE_LENGTH = 100;
// oxlint-disable-next-line no-control-regex -- 탭 이름에 들어간 제어 문자(줄바꿈 등)를 거부하려는 의도된 패턴
const CONTROL_CHARACTER = /[\u0000-\u001F\u007F]/u;

/** 주소창 URL 또는 ID → ID. 알아볼 수 없으면 undefined */
export function parseSpreadsheetId(input: string): string | undefined {
	const trimmed = input.trim();
	const candidate = SPREADSHEET_URL.exec(trimmed)?.groups?.id ?? trimmed;
	return SPREADSHEET_ID.test(candidate) ? candidate : undefined;
}

export function spreadsheetEditUrl(spreadsheetId: string): string {
	return `${EDIT_URL_BASE}/${encodeURIComponent(spreadsheetId)}/edit`;
}

export type SheetTitleProblem = "empty" | "too_long" | "control_character";

/** 탭 이름으로 쓸 수 없는 이유. 쓸 수 있으면 null (앞뒤 공백은 호출하는 쪽이 정리한다) */
export function sheetTitleProblem(title: string): SheetTitleProblem | null {
	if (title === "") {
		return "empty";
	}
	if (title.length > MAX_SHEET_TITLE_LENGTH) {
		return "too_long";
	}
	if (CONTROL_CHARACTER.test(title)) {
		return "control_character";
	}
	return null;
}

/**
 * 같은 탭 이름인지. Google 시트의 탭 이름은 대소문자를 구분하지 않는다
 * ("Retreat"와 "retreat"는 한 스프레드시트에 함께 있을 수 없고, A1 범위도 같은 탭을 가리킨다).
 */
export function sameSheetTitle(a: string, b: string): boolean {
	return sheetTitleKey(a) === sheetTitleKey(b);
}

/** 탭 이름 비교 키 (대소문자 무시). DB 유니크 인덱스도 같은 기준(lower)을 쓴다 */
export function sheetTitleKey(title: string): string {
	return title.trim().toLowerCase();
}
