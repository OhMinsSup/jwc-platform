// 핵심 타입과 인터페이스
export type {
	RowFormData,
	SpreadsheetHeader,
	SpreadsheetHeaders,
	GoogleSheetColumnType,
	ExcelGenerateOptions,
	GoogleSheetsConfig,
	ExcelExportConfig,
	SpreadsheetConfig,
	SpreadsheetData,
} from "./core/types";

// 핵심 클래스들
export { SpreadsheetManager } from "./core/manager";
export { SpreadsheetBuilder } from "./core/builder";

// 팩토리 함수들
import { createFormSpreadsheet, createSpreadsheet } from "./core/builder";
export { createSpreadsheet, createFormSpreadsheet };

// Excel 관련 클래스들
export { ExcelManager } from "./excel/manager";
export { ExcelHeaderManager } from "./excel/headers";
export { ExcelRowDataManager } from "./excel/rowData";
export { ExcelStyleManager } from "./excel/styler";

// Google Sheets 관련 클래스들
export { GoogleApiClient, googleApiClient } from "./google/client";
export { GoogleSheetsSyncManager } from "./google/sync";

// 유틸리티 함수들
export { DataConverter } from "./utils/converter";
export {
	validateSpreadsheetConfig,
	validateRowFormData,
	isEmpty,
	removeDuplicates,
	safeJsonParse,
} from "./utils/validator";

// 기본 인스턴스 (하위 호환성)
export const spreadsheet = createSpreadsheet();
export const formSpreadsheet = createFormSpreadsheet();
