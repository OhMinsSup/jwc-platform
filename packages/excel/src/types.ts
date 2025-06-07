import type * as Excel from "exceljs";

/**
 * 신청서 데이터의 한 행(Row)에 해당하는 타입입니다.
 * 각 필드는 시트의 컬럼명과 1:1로 매핑됩니다.
 */
export type RowFormData = {
	ID: string | number;
	타임스탬프: string;
	이름: string;
	또래모임: string;
	연락처: string;
	성별: string;
	부서: string;
	"단체티 사이즈"?: string;
	"픽업 가능 시간": string;
	"회비 납입 여부": string;
	"참석 형태": string;
	"참석 날짜"?: string;
	"참석 시간"?: string;
	"TF팀 지원": string;
	"차량 지원 여부": string;
	"차량 지원 내용": string;
};

/**
 * Google Sheets에서 지원하는 테이블 컬럼 타입 Enum
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

/**
 * Excel 헤더 정의 타입
 * @property name - 컬럼명
 * @property key - 데이터 키(옵션)
 * @property width - 컬럼 너비(px)
 * @property hidden - 숨김 여부(옵션)
 * @property columnType - 컬럼 타입(옵션)
 * @property options - 드롭다운 등 옵션 값(옵션)
 */
export type ExcelHeader = {
	name: string;
	key?: string;
	width: number;
	hidden?: boolean;
	columnType?: GoogleSheetColumnType;
	options?: string[];
};

/**
 * Excel 헤더 배열 타입
 */
export type ExcelHeaders = ExcelHeader[];

/**
 * Excel 파일 생성 옵션 인터페이스
 * @template Row - 행 데이터 타입
 */
export interface GenerateExcelOptions<Row = Record<string, string | number>> {
	workbook: Excel.Workbook;
	sheet: Excel.Worksheet;
	headers: ExcelHeader[];
	rows: Row[];
}
