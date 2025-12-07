/**
 * @fileoverview 스프레드시트 패키지 핵심 인터페이스 정의
 *
 * 이 파일은 스프레드시트 패키지의 모든 추상화를 정의합니다.
 * 의존성 역전 원칙(DIP)을 적용하여 고수준 모듈이 저수준 구현에 의존하지 않도록 합니다.
 */

import type * as Excel from "exceljs";

/**
 * 스프레드시트 컬럼 타입
 * Excel과 Google Sheets에서 공통으로 사용되는 타입
 */
export type ColumnType =
	| "text"
	| "number"
	| "boolean"
	| "date"
	| "datetime"
	| "time"
	| "dropdown"
	| "currency"
	| "percent";

/**
 * 컬럼 정의 인터페이스
 */
export interface IColumnDefinition<T = unknown> {
	/** 데이터 객체의 키 */
	key: keyof T | string;
	/** 표시될 헤더명 */
	header: string;
	/** 컬럼 너비 (Excel용) */
	width?: number;
	/** 컬럼 타입 */
	type?: ColumnType;
	/** 드롭다운 옵션 (type이 'dropdown'일 때) */
	options?: string[];
	/** 값 포맷터 함수 */
	formatter?: (value: unknown, row: T) => string;
	/** 정렬 방식 */
	align?: "left" | "center" | "right";
	/** 필수 여부 */
	required?: boolean;
}

/**
 * 스키마 정의 인터페이스
 * 스프레드시트의 구조를 정의합니다.
 */
export interface ISpreadsheetSchema<T = Record<string, unknown>> {
	/** 스키마 이름 */
	name: string;
	/** 스키마 설명 */
	description?: string;
	/** 컬럼 정의 배열 */
	columns: IColumnDefinition<T>[];
	/** 기본 시트명 */
	defaultSheetName?: string;
}

/**
 * 데이터 변환기 인터페이스
 * 원본 데이터를 스프레드시트 형식으로 변환합니다.
 */
export interface IDataTransformer<TInput = unknown, TOutput = unknown> {
	/**
	 * 단일 데이터 변환
	 * @param data - 변환할 원본 데이터
	 * @param index - 데이터 인덱스 (선택)
	 * @returns 변환된 데이터
	 */
	transform(data: TInput, index?: number): TOutput;

	/**
	 * 배열 데이터 변환
	 * @param dataArray - 변환할 원본 데이터 배열
	 * @returns 변환된 데이터 배열
	 */
	transformMany(dataArray: TInput[]): TOutput[];
}

/**
 * 값 포맷터 인터페이스
 */
export interface IValueFormatter {
	/**
	 * 값을 문자열로 포맷
	 * @param value - 포맷할 값
	 * @param type - 값 타입 (선택)
	 * @returns 포맷된 문자열
	 */
	format(value: unknown, type?: ColumnType): string;
}

// ============================================================================
// Excel 관련 인터페이스
// ============================================================================

/**
 * Excel 스타일 설정
 */
export interface IExcelStyleConfig {
	header?: {
		backgroundColor?: string;
		fontColor?: string;
		fontBold?: boolean;
		fontSize?: number;
	};
	data?: {
		fontColor?: string;
		fontSize?: number;
		alternateRowColor?: string;
	};
	border?: {
		color?: string;
		style?: "thin" | "medium" | "thick";
	};
}

/**
 * Excel 스타일러 인터페이스
 */
export interface IExcelStyler {
	/**
	 * 스타일 설정 적용
	 * @param config - 스타일 설정
	 */
	configure(config: IExcelStyleConfig): void;

	/**
	 * 헤더 셀 스타일 적용
	 * @param cell - 스타일 적용할 셀
	 */
	styleHeaderCell(cell: Excel.Cell): void;

	/**
	 * 데이터 셀 스타일 적용
	 * @param cell - 스타일 적용할 셀
	 * @param rowIndex - 행 인덱스
	 */
	styleDataCell(cell: Excel.Cell, rowIndex?: number): void;

	/**
	 * 워크시트 스타일 적용
	 * @param worksheet - 스타일 적용할 워크시트
	 */
	styleWorksheet(worksheet: Excel.Worksheet): void;
}

/**
 * Excel 빌더 인터페이스
 */
export interface IExcelBuilder<T = Record<string, unknown>> {
	/**
	 * 스키마 설정
	 * @param schema - 스프레드시트 스키마
	 * @returns this (체이닝 지원)
	 */
	withSchema(schema: ISpreadsheetSchema<T>): this;

	/**
	 * 데이터 설정
	 * @param data - 데이터 배열
	 * @returns this (체이닝 지원)
	 */
	withData(data: T[]): this;

	/**
	 * 스타일 설정
	 * @param config - 스타일 설정
	 * @returns this (체이닝 지원)
	 */
	withStyle(config: IExcelStyleConfig): this;

	/**
	 * 시트명 설정
	 * @param name - 시트명
	 * @returns this (체이닝 지원)
	 */
	withSheetName(name: string): this;

	/**
	 * 워크북 생성
	 * @returns 생성된 워크북
	 */
	build(): Promise<Excel.Workbook>;

	/**
	 * Buffer로 내보내기
	 * @returns Excel 파일 Buffer
	 */
	toBuffer(): Promise<Buffer>;
}

// ============================================================================
// Google Sheets 관련 인터페이스
// ============================================================================

/**
 * Google Sheets 설정
 */
export interface IGoogleSheetsConfig {
	spreadsheetId?: string;
	sheetName?: string;
	credentials?: Partial<{
		clientEmail: string;
		privateKey: string;
	}>;
}

/**
 * Google Sheets 클라이언트 인터페이스
 */
export interface IGoogleSheetsClient {
	/**
	 * 스프레드시트 접근 권한 확인
	 * @param spreadsheetId - 스프레드시트 ID
	 * @returns 접근 가능 여부
	 */
	checkAccess(spreadsheetId: string): Promise<boolean>;

	/**
	 * 시트 메타데이터 조회
	 * @param spreadsheetId - 스프레드시트 ID
	 * @param sheetName - 시트 이름
	 * @returns 시트 메타데이터
	 */
	getSheetMetadata(
		spreadsheetId: string,
		sheetName: string
	): Promise<{ sheetId: number | null; exists: boolean }>;

	/**
	 * 시트 생성
	 * @param spreadsheetId - 스프레드시트 ID
	 * @param sheetName - 시트 이름
	 * @returns 생성된 시트 ID
	 */
	createSheet(spreadsheetId: string, sheetName: string): Promise<number>;

	/**
	 * 데이터 쓰기
	 * @param spreadsheetId - 스프레드시트 ID
	 * @param range - 범위
	 * @param values - 값 배열
	 */
	writeData(
		spreadsheetId: string,
		range: string,
		values: unknown[][]
	): Promise<void>;

	/**
	 * 데이터 클리어
	 * @param spreadsheetId - 스프레드시트 ID
	 * @param range - 범위
	 */
	clearData(spreadsheetId: string, range: string): Promise<void>;
}

/**
 * Google Sheets 동기화 인터페이스
 */
export interface IGoogleSheetsSyncer<T = Record<string, unknown>> {
	/**
	 * 스키마 설정
	 * @param schema - 스프레드시트 스키마
	 * @returns this (체이닝 지원)
	 */
	withSchema(schema: ISpreadsheetSchema<T>): this;

	/**
	 * 데이터 설정
	 * @param data - 데이터 배열
	 * @returns this (체이닝 지원)
	 */
	withData(data: T[]): this;

	/**
	 * Google Sheets에 동기화
	 * @returns 동기화 결과
	 */
	sync(): Promise<{ success: boolean; rowCount: number }>;
}

/**
 * 스프레드시트 실행 결과
 */
export interface ISpreadsheetResult {
	excel?: {
		workbook: Excel.Workbook;
		buffer: Buffer;
	};
	googleSheets?: {
		success: boolean;
		rowCount: number;
		sheetUrl?: string;
	};
}

/**
 * 스프레드시트 빌더 옵션
 */
export interface ISpreadsheetOptions {
	excel?: {
		fileName?: string;
		sheetName?: string;
		enableStyling?: boolean;
		styleConfig?: IExcelStyleConfig;
	};
	googleSheets?: IGoogleSheetsConfig;
}

/**
 * 통합 스프레드시트 빌더 인터페이스
 */
export interface ISpreadsheetBuilder<T = Record<string, unknown>> {
	/**
	 * 스키마 설정
	 * @param schema - 스프레드시트 스키마
	 * @returns this (체이닝 지원)
	 */
	withSchema(schema: ISpreadsheetSchema<T>): this;

	/**
	 * 데이터 설정
	 * @param data - 데이터 배열
	 * @returns this (체이닝 지원)
	 */
	withData(data: T[]): this;

	/**
	 * Excel 내보내기 활성화
	 * @param fileName - 파일명
	 * @param options - 추가 옵션
	 * @returns this (체이닝 지원)
	 */
	withExcel(
		fileName: string,
		options?: Partial<ISpreadsheetOptions["excel"]>
	): this;

	/**
	 * Google Sheets 동기화 활성화
	 * @param config - Google Sheets 설정
	 * @returns this (체이닝 지원)
	 */
	withGoogleSheets(config: IGoogleSheetsConfig): this;

	/**
	 * 환경 변수에서 Google Sheets 설정 로드
	 * @param sheetName - 시트명 (선택)
	 * @returns this (체이닝 지원)
	 */
	withGoogleSheetsFromEnv(sheetName?: string): this;

	/**
	 * 설정 검증
	 * @returns 검증 결과
	 */
	validate(): { isValid: boolean; errors: string[] };

	/**
	 * 모든 작업 실행
	 * @returns 실행 결과
	 */
	execute(): Promise<ISpreadsheetResult>;

	/**
	 * 리소스 정리
	 */
	dispose(): void;
}

/**
 * 스키마 레지스트리 인터페이스
 * 다양한 스키마를 등록하고 관리합니다.
 */
export interface ISchemaRegistry {
	/**
	 * 스키마 등록
	 * @param name - 스키마 이름
	 * @param schema - 스키마 정의
	 */
	register<T>(name: string, schema: ISpreadsheetSchema<T>): void;

	/**
	 * 스키마 조회
	 * @param name - 스키마 이름
	 * @returns 스키마 정의
	 */
	get<T>(name: string): ISpreadsheetSchema<T> | undefined;

	/**
	 * 등록된 모든 스키마 이름 조회
	 * @returns 스키마 이름 배열
	 */
	list(): string[];

	/**
	 * 스키마 존재 여부 확인
	 * @param name - 스키마 이름
	 * @returns 존재 여부
	 */
	has(name: string): boolean;
}
