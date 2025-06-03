import {
	getAttendanceDayOptions,
	getAttendanceTimeOptions,
	getDepartmentOptions,
	getGenderOptions,
	getNumberOfStaysOptions,
	getTfTeamOptions,
	getTshirtSizeOptions,
} from "@jwc/utils/options";
import type { ExcelHeader, ExcelHeaders } from "./types";

/**
 * Excel 및 Google Sheets용 헤더 생성 유틸리티 클래스
 * @remarks
 * - 신청서 시트의 헤더 정보를 관리하고, Excel/Google Sheets에 맞는 형태로 변환합니다.
 */
export class ExcelHead {
	/**
	 * 내부적으로 사용하는 헤더 정의 배열
	 * @private
	 */
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
			// options: ["남성", "여성"],
			options: getGenderOptions().map((option) => option.value),
		},
		{
			name: "부서",
			key: "department",
			width: 55,
			columnType: "DROPDOWN",
			// options: ["청년1부", "청년2부", "기타"],
			options: getDepartmentOptions().map((option) => option.value),
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
			// options: ["3박4일", "2박3일", "1박2일", "무박"],
			options: getNumberOfStaysOptions().map((option) => option.value),
		},
		{
			name: "참석 날짜",
			key: "attendanceDay",
			width: 100,
			columnType: "DROPDOWN",
			// options: ["6월 19일", "6월 20일", "6월 21일", "6월 22일"],
			options: getAttendanceDayOptions().map((option) => option.name),
		},
		{
			name: "참석 시간",
			key: "attendanceTime",
			width: 100,
			columnType: "DROPDOWN",
			// options: ["오전", "오후", "저녁"],
			options: getAttendanceTimeOptions().map((option) => option.name),
		},
		{
			name: "TF팀 지원",
			key: "tfTeam",
			width: 80,
			columnType: "DROPDOWN",
			// options: ["없음", "찬양팀", "프로그램팀", "미디어팀"],
			options: getTfTeamOptions().map((option) => option.value),
		},
		{
			name: "단체티 사이즈",
			key: "tshirtSize",
			width: 80,
			hidden: true,
			columnType: "DROPDOWN",
			// options: ["S ", "m", "l", "xl", "2xl", "3xl"],
			options: getTshirtSizeOptions().map((option) => option.name),
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

	/**
	 * 픽셀 단위의 너비를 Excel 열 너비로 변환합니다.
	 * @param pxWidth - 픽셀 단위 너비
	 * @returns Excel 열 너비
	 * @private
	 */
	private _pixelToExcelWidth(pxWidth: number): number {
		// Calibri 11pt 기준으로 1 열 너비는 대략 7 픽셀에 해당
		// 이는 근사치이며, 정확한 비율은 사용 환경에 따라 다를 수 있음
		const approximateRatio = 7;
		return pxWidth / approximateRatio;
	}

	/**
	 * ExcelHeader 객체를 Excel에 적합한 형태로 변환합니다.
	 * @param header - ExcelHeader 객체
	 * @returns 변환된 ExcelHeader 객체
	 * @private
	 */
	private _formatter(header: ExcelHeader): ExcelHeader {
		return {
			name: header.name,
			width: this._pixelToExcelWidth(header.width),
		};
	}

	/**
	 * 신청서 시트의 헤더 배열을 생성합니다.
	 * @returns ExcelHeaders 배열 (숨김 컬럼 제외, Excel용 너비 변환)
	 */
	createFormSheetHeaders(): ExcelHeaders {
		return this._headers
			.filter((header) => !header.hidden)
			.map((header) => this._formatter(header));
	}

	/**
	 * Google Sheets용 헤더 객체 배열을 생성합니다.
	 * @returns ExcelHeader[] (순서 컬럼 제외)
	 */
	createFormGoogleSheetHeaders(): ExcelHeaders {
		return this._headers.filter((h) => h.name !== "타임스탬프");
	}
}
