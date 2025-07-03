import type * as Excel from "exceljs";

/**
 * 신청서 데이터의 한 행(Row)에 해당하는 타입
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
 * Google Sheets에서 지원하는 테이블 컬럼 타입
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
 * 스프레드시트 헤더 정의
 */
export type SpreadsheetHeader = {
	/** 헤더 표시명 */
	name: string;
	/** 컬럼 너비 (Excel용) */
	width: number;
	/** Google Sheets 컬럼 타입 */
	columnType: GoogleSheetColumnType;
	/** 드롭다운 옵션 (columnType이 DROPDOWN일 때) */
	options?: string[];
};

/**
 * 스프레드시트 헤더 배열
 */
export type SpreadsheetHeaders = SpreadsheetHeader[];

/**
 * Excel 생성 옵션
 */
export type ExcelGenerateOptions = {
	/** 워크시트 인스턴스 */
	sheet: Excel.Worksheet;
	/** 헤더 정의 */
	headers: SpreadsheetHeaders;
	/** 데이터 행 */
	rows: RowFormData[];
};

/**
 * Google Sheets 설정 옵션
 */
export type GoogleSheetsConfig = {
	/** 스프레드시트 ID */
	spreadsheetId: string;
	/** 시트 이름 */
	sheetName: string;
	/** 클라이언트 이메일 */
	clientEmail: string;
	/** 개인 키 */
	privateKey: string;
};

/**
 * Excel 내보내기 설정
 */
export type ExcelExportConfig = {
	/** 파일명 */
	fileName: string;
	/** 워크시트 이름 */
	sheetName: string;
	/** 스타일 적용 여부 */
	enableStyling: boolean;
};

/**
 * 스프레드시트 매니저 설정
 */
export type SpreadsheetConfig = {
	/** Google Sheets 설정 */
	google?: GoogleSheetsConfig;
	/** Excel 설정 */
	excel?: ExcelExportConfig;
};

/**
 * 스프레드시트 매니저에서 사용할 데이터 타입
 */
export type SpreadsheetData<T = RowFormData> = T extends Record<string, unknown>
	? T
	: RowFormData;
