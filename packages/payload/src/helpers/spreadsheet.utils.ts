import { DataConverter, type RowFormData } from "@jwc/spreadsheet";

/**
 * 스프레드시트 API 요청 타입
 */
export interface SpreadsheetApiRequest {
	/** 출력 형식: excel, google, both */
	format?: "excel" | "google" | "both";
	/** 조회할 데이터 개수 */
	limit?: number;
	/** 다운로드 여부 (Excel 파일 다운로드) */
	download?: boolean;
}

/**
 * 스프레드시트 API 응답 타입
 */
export interface SpreadsheetApiResponse {
	/** 성공 여부 */
	success: boolean;
	/** 메시지 */
	message: string;
	/** 처리된 형식 */
	format: string;
	/** 처리된 레코드 수 */
	recordCount: number;
	/** Google Sheets URL (해당하는 경우) */
	sheetUrl?: string;
}

/**
 * 스프레드시트 API 사용 가이드
 */
export const SPREADSHEET_API_GUIDE = {
	endpoints: {
		legacy: {
			excel: "/api/export/excel",
			googleSync: "/webhooks/google-sheet",
		},
		integrated: "/api/spreadsheet",
	},
	queryParameters: {
		format: {
			description: "출력 형식",
			values: ["excel", "google", "both"],
			default: "both",
		},
		limit: {
			description: "조회할 데이터 개수",
			type: "number",
			default: 100,
		},
		download: {
			description: "Excel 파일 다운로드 여부",
			type: "boolean",
			default: false,
		},
	},
	examples: {
		excelDownload: "/api/spreadsheet?format=excel&download=true",
		googleSync: "/api/spreadsheet?format=google",
		bothProcessing: "/api/spreadsheet?format=both&limit=50",
		downloadWithGoogleSync: "/api/spreadsheet?format=both&download=true",
	},
} as const;

/**
 * 스프레드시트 데이터 변환 유틸리티
 * @deprecated 이 유틸리티는 더 이상 사용되지 않습니다. 대신 @jwc/spreadsheet의 DataConverter를 사용하세요.
 */
export namespace PayloadSpreadsheetUtils {
	/**
	 * Payload 문서를 RowFormData로 변환
	 * @deprecated DataConverter.toRowFormData를 사용하세요.
	 */
	export function transformPayloadDocs(
		docs: Record<string, unknown>[]
	): RowFormData[] {
		return docs.map((doc) => DataConverter.toRowFormData(doc));
	}

	/**
	 * 스프레드시트 API 요청 파라미터 검증
	 */
	export function validateApiRequest(
		searchParams: URLSearchParams
	): SpreadsheetApiRequest {
		const format = searchParams.get("format") as
			| "excel"
			| "google"
			| "both"
			| null;
		const limit = searchParams.get("limit");
		const download = searchParams.get("download");

		return {
			format:
				format && ["excel", "google", "both"].includes(format)
					? format
					: "both",
			limit: limit ? Number.parseInt(limit, 10) : 100,
			download: download === "true",
		};
	}

	/**
	 * API 응답 생성 헬퍼
	 */
	export function createApiResponse(
		success: boolean,
		message: string,
		format: string,
		recordCount: number,
		sheetUrl?: string
	): SpreadsheetApiResponse {
		return {
			success,
			message,
			format,
			recordCount,
			...(sheetUrl && { sheetUrl }),
		};
	}
}
