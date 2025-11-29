/**
 * @fileoverview 스프레드시트 패키지 진입점
 *
 * Excel 파일 생성과 Google Sheets 동기화 기능을 제공합니다.
 *
 * @example
 * ```typescript
 * import { createExcelBuffer, clubFormSchema } from "@jwc/spreadsheet";
 *
 * const buffer = await createExcelBuffer(clubFormSchema, data);
 * ```
 */

// ============================================================================
// 핵심 인터페이스와 타입
// ============================================================================

export type {
	// 기본 타입
	ColumnType,
	// 스키마 관련
	IColumnDefinition,
	// 데이터 변환
	IDataTransformer,
	// Excel 관련
	IExcelBuilder,
	IExcelStyleConfig,
	IExcelStyler,
	// Google Sheets 관련
	IGoogleSheetsClient,
	IGoogleSheetsConfig,
	IGoogleSheetsSyncer,
	ISchemaRegistry,
	// 통합 빌더
	ISpreadsheetBuilder,
	ISpreadsheetOptions,
	ISpreadsheetResult,
	ISpreadsheetSchema,
	IValueFormatter,
} from "./core/interfaces";

// ============================================================================
// 스키마 정의
// ============================================================================

// 스키마 빌더
// 스키마 레지스트리
export {
	ColumnBuilder,
	column,
	defineSchema,
	SchemaBuilder,
	schemaRegistry,
} from "./core/schema";

// 미리 정의된 스키마
export type {
	ClubFormData,
	GenericFormData,
	RetreatFormData,
} from "./core/schemas";
export {
	// 스키마 유틸리티
	addDynamicColumns,
	clubFormSchema,
	extendSchema,
	omitColumns,
	pickColumns,
	retreatFormSchema,
} from "./core/schemas";

// ============================================================================
// 데이터 변환
// ============================================================================

export {
	DefaultValueFormatter,
	// 유틸리티 함수
	getValue,
	isEmpty,
	removeDuplicates,
	SchemaBasedTransformer,
	safeJsonParse,
} from "./core/transformer";

// ============================================================================
// Excel
// ============================================================================

export {
	createExcelBuffer,
	// 팩토리 함수
	createExcelBuilder,
	ExcelBuilder,
	ExcelStyler,
} from "./excel/builder";

// ============================================================================
// Google Sheets
// ============================================================================

export {
	createGoogleSheetsClient,
	GoogleSheetsClient,
	type GoogleSheetsTable,
	getDefaultGoogleSheetsClient,
	type SheetMetadata,
} from "./google/client";

export {
	createGoogleSheetsSyncer,
	GoogleSheetsSyncer,
	type GoogleSheetsSyncResult,
	syncToGoogleSheets,
} from "./google/sync";
