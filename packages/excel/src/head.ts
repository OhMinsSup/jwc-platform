/**
 * Google Sheets Table Column Type Enum
 * - COLUMN_TYPE_UNSPECIFIED: 지정되지 않은 열 유형입니다.
 * - DOUBLE: 숫자 열 유형입니다.
 * - CURRENCY: 통화 열 유형입니다.
 * - PERCENT: 퍼센트 열 유형입니다.
 * - DATE: 날짜 열 유형입니다.
 * - TIME: 시간 열 유형입니다.
 * - DATE_TIME: 날짜 및 시간 열 유형입니다.
 * - TEXT: 텍스트 열 유형입니다.
 * - BOOLEAN: 불리언 열 유형입니다.
 * - DROPDOWN: 드롭다운 열 유형입니다.
 * - FILES_CHIP: 파일 칩 열 유형입니다.
 * - PEOPLE_CHIP: 사용자 칩 열 유형입니다.
 * - FINANCE_CHIP: 금융 칩 열 유형입니다.
 * - PLACE_CHIP: 장소 칩 열 유형입니다.
 * - RATINGS_CHIP: 평점 칩 열 유형입니다.
 */
export type GoogleSheetColumnType =
	| "COLUMN_TYPE_UNSPECIFIED"
	| "DOUBLE"
	| "CURRENCY"
	| "PERCENT"
	| "DATE"
	| "TIME"
	| "DATE_TIME"
	| "TEXT"
	| "BOOLEAN"
	| "DROPDOWN"
	| "FILES_CHIP"
	| "PEOPLE_CHIP"
	| "FINANCE_CHIP"
	| "PLACE_CHIP"
	| "RATINGS_CHIP";

type ExcelHeader = {
	name: string;
	key?: string;
	width: number;
	hidden?: boolean;
	columnType?: GoogleSheetColumnType;
	options?: string[];
};

type ExcelHeaders = ExcelHeader[];

export class ExcelHead {
	private _headers: ExcelHeaders = [
		{
			name: "순서",
			width: 50,
			columnType: "DOUBLE",
		},
		{
			name: "타임스탬프",
			key: "timestamp",
			width: 140,
			columnType: "DATE_TIME",
		},
		{
			name: "이름",
			key: "name",
			width: 200,
			columnType: "TEXT",
		},
		{
			name: "연락처",
			key: "phone",
			width: 80,
			columnType: "TEXT",
		},
		{
			name: "또래모임",
			key: "ageGroup",
			width: 70,
			columnType: "TEXT",
		},
		{
			name: "성별",
			key: "gender",
			width: 40,
			columnType: "DROPDOWN",
			options: ["남성", "여성"],
		},
		{
			name: "부서",
			key: "department",
			width: 55,
			columnType: "DROPDOWN",
			options: ["청년1부", "청년2부", "기타"],
		},
		{
			name: "픽업 가능 시간",
			key: "pickupTimeDesc",
			width: 200,
			columnType: "TEXT",
		},
		{
			name: "참석 형태",
			key: "numberOfStays",
			width: 70,
			columnType: "DROPDOWN",
			options: ["3박4일", "2박3일", "1박2일", "무박"],
		},
		{
			name: "참석 날짜",
			key: "attendanceDay",
			width: 100,
			columnType: "DROPDOWN",
			options: ["6월 19일", "6월 20일", "6월 21일", "6월 22일"],
		},
		{
			name: "참석 시간",
			key: "attendanceTime",
			width: 100,
			columnType: "DROPDOWN",
			options: ["오전", "오후", "저녁"],
		},
		{
			name: "TF팀 지원",
			key: "tfTeam",
			width: 80,
			columnType: "DROPDOWN",
			options: ["없음", "찬양팀", "프로그램팀", "미디어팀"],
		},
		{
			name: "단체티 사이즈",
			key: "tshirtSize",
			width: 80,
			hidden: true,
			columnType: "DROPDOWN",
			options: ["s", "m", "l", "xl", "2xl", "3xl"],
		},
		{
			name: "차량 지원 여부",
			key: "carSupport",
			width: 100,
			columnType: "DROPDOWN",
			options: ["지원", "미지원"],
		},
		{
			name: "차량 지원 내용",
			key: "carSupportContent",
			width: 200,
			columnType: "TEXT",
		},
		{
			name: "회비 납입 여부",
			key: "isPaid",
			width: 100,
			columnType: "DROPDOWN",
			options: ["납입", "미납"],
		},
	];

	// _headers 배열에 저장된 픽셀 단위 너비를 Excel의 너비 기준으로 변환
	private _pixelToExcelWidth(pxWidth: number): number {
		// Calibri 11pt 기준으로 1 열 너비는 대략 7 픽셀에 해당
		// 이는 근사치이며, 정확한 비율은 사용 환경에 따라 다를 수 있음
		const approximateRatio = 7;
		return pxWidth / approximateRatio;
	}

	// ExcelHeader 객체를 Excel에 적합한 형태로 변환
	private _formatter(header: ExcelHeader): ExcelHeader {
		return {
			name: header.name,
			width: this._pixelToExcelWidth(header.width),
		};
	}

	// 신청서 시트의 헤더를 생성
	createFormSheetHeaders() {
		return this._headers
			.filter((header) => !header.hidden)
			.map((header) => this._formatter(header));
	}

	createFormGoogleSheetHeaders() {
		return this._headers.filter((h) => h.name !== "순서");
	}
}
