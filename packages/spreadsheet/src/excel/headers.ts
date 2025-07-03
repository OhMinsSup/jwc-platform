import * as Excel from "exceljs";
import type { RowFormData, SpreadsheetHeaders } from "../core/types";

/**
 * Excel 헤더 관리 클래스
 * Form 데이터에 특화된 헤더 생성 및 관리 기능을 제공합니다.
 */
export class ExcelHeaderManager {
	/**
	 * Form 데이터용 Excel 헤더를 생성합니다.
	 * @returns 생성된 헤더 배열
	 */
	createFormHeaders(): SpreadsheetHeaders {
		return [
			{ name: "순번", width: 10, columnType: "DOUBLE" },
			{ name: "이름", width: 15, columnType: "TEXT" },
			{ name: "또래모임", width: 15, columnType: "TEXT" },
			{ name: "연락처", width: 20, columnType: "TEXT" },
			{
				name: "성별",
				width: 10,
				columnType: "DROPDOWN",
				options: ["남성", "여성"],
			},
			{
				name: "부서",
				width: 15,
				columnType: "DROPDOWN",
				options: ["청년1부", "청년2부", "기타"],
			},
			{
				name: "단체티 사이즈",
				width: 15,
				columnType: "DROPDOWN",
				options: ["S", "M", "L", "XL", "2XL", "3XL"],
			},
			{ name: "픽업 가능 시간", width: 30, columnType: "TEXT" },
			{
				name: "회비 납입 여부",
				width: 15,
				columnType: "DROPDOWN",
				options: ["예", "아니오"],
			},
			{
				name: "참석 형태",
				width: 15,
				columnType: "DROPDOWN",
				options: ["3박4일", "2박3일", "1박2일", "무박"],
			},
			{ name: "참석 날짜", width: 20, columnType: "DATE" },
			{ name: "참석 시간", width: 15, columnType: "TIME" },
			{
				name: "TF팀 지원",
				width: 15,
				columnType: "DROPDOWN",
				options: ["없음", "찬양팀", "프로그램팀", "미디어팀"],
			},
			{
				name: "차량 지원 여부",
				width: 15,
				columnType: "DROPDOWN",
				options: ["예", "아니오"],
			},
			{ name: "차량 지원 내용", width: 30, columnType: "TEXT" },
		];
	}

	/**
	 * Google Sheets용 헤더를 생성합니다.
	 * @returns Google Sheets 테이블용 헤더 배열
	 */
	createGoogleSheetHeaders(): SpreadsheetHeaders {
		return this.createFormHeaders();
	}
}
