import { log } from "@jwc/observability/log";
import { headers } from "next/headers";

/**
 * 내부 API 호출 옵션
 */
export interface InternalApiOptions {
	/** HTTP 메서드 */
	method?: "GET" | "POST" | "PUT" | "DELETE";
	/** 쿼리 파라미터 */
	params?: Record<string, string | number | boolean>;
	/** 요청 본문 */
	body?: unknown;
	/** 추가 헤더 */
	additionalHeaders?: Record<string, string>;
	/** 응답 타입 */
	responseType?: "json" | "blob" | "text";
}

/**
 * 내부 API 응답 타입
 */
export interface InternalApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	message?: string;
	error?: string;
	[key: string]: unknown;
}

/**
 * 스프레드시트 API 응답 데이터 타입
 */
export interface SpreadsheetApiData {
	recordCount?: number;
	sheetUrl?: string;
	message?: string;
	downloadUrl?: string;
	fileSize?: number;
	format?: "excel" | "google" | "both";
}

/**
 * 스프레드시트 API 응답 타입
 */
export type SpreadsheetApiResponse = InternalApiResponse<SpreadsheetApiData>;

/**
 * 베이스 URL 가져오기
 */
function getBaseUrl(): string {
	return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
}

/**
 * 쿼리 파라미터를 URL 문자열로 변환
 */
function buildQueryString(
	params: Record<string, string | number | boolean>
): string {
	const searchParams = new URLSearchParams();

	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined && value !== null) {
			searchParams.set(key, String(value));
		}
	}

	return searchParams.toString();
}

/**
 * 인증 헤더 가져오기
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
	const headersList = await headers();
	return {
		Authorization: headersList.get("Authorization") || "",
		Cookie: headersList.get("Cookie") || "",
	};
}

/**
 * 내부 API 호출 함수
 * Payload 패키지 내에서 내부 API endpoints를 호출할 때 사용
 */
export async function callInternalApi<T = unknown>(
	endpoint: string,
	options: InternalApiOptions = {}
): Promise<InternalApiResponse<T>> {
	const {
		method = "GET",
		params = {},
		body,
		additionalHeaders = {},
		responseType = "json",
	} = options;

	try {
		const baseUrl = getBaseUrl();
		const queryString =
			Object.keys(params).length > 0 ? `?${buildQueryString(params)}` : "";
		const url = `${baseUrl}${endpoint}${queryString}`;

		// 기본 헤더 설정
		const authHeaders = await getAuthHeaders();
		const defaultHeaders: Record<string, string> = {
			...authHeaders,
			...additionalHeaders,
		};

		// Content-Type 설정 (body가 있는 경우)
		if (body && method !== "GET") {
			defaultHeaders["Content-Type"] = "application/json";
		}

		// fetch 요청
		const response = await fetch(url, {
			method,
			headers: defaultHeaders,
			...(body && method !== "GET" ? { body: JSON.stringify(body) } : {}),
		});

		// 에러 상태 확인
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`API call failed: ${response.status} ${response.statusText} - ${errorText}`
			);
		}

		// 응답 타입에 따른 처리
		let responseData: T;
		switch (responseType) {
			case "blob": {
				const blob = await response.blob();
				responseData = (await blob.arrayBuffer()) as T;
				break;
			}
			case "text":
				responseData = (await response.text()) as T;
				break;
			default:
				responseData = await response.json();
				break;
		}

		// 성공 응답
		return {
			success: true,
			data: responseData,
		};
	} catch (error) {
		// 에러 로깅
		log.error("internalApi", error as Error, {
			name: "callInternalApi",
			action: "internal-api-call",
			endpoint,
			method,
			params,
		});

		// 에러 응답
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error occurred",
			message: "An error occurred while calling internal API",
		};
	}
}

/**
 * 스프레드시트 관련 API 호출을 위한 특화된 함수들
 */
export namespace SpreadsheetApi {
	/**
	 * 스프레드시트 처리 API 호출
	 */
	export async function processSpreadsheet(options: {
		format?: "excel" | "google" | "both";
		limit?: number;
		download?: boolean;
	}): Promise<SpreadsheetApiResponse | InternalApiResponse<ArrayBuffer>> {
		const { format = "google", limit = 100, download = false } = options;

		// Excel 다운로드인 경우 blob 형태로 받음
		if (format === "excel" && download) {
			return await callInternalApi<ArrayBuffer>("/api/spreadsheet", {
				method: "GET",
				params: { format, limit, download },
				responseType: "blob",
			});
		}

		// 일반적인 경우
		return await callInternalApi<SpreadsheetApiData>("/api/spreadsheet", {
			method: "GET",
			params: { format, limit, download },
		});
	}

	/**
	 * Excel 다운로드
	 */
	export async function downloadExcel(
		limit = 100
	): Promise<InternalApiResponse<Blob>> {
		return await callInternalApi<Blob>("/api/spreadsheet", {
			method: "GET",
			params: {
				format: "excel",
				download: true,
				limit,
			},
			responseType: "blob",
		});
	}

	/**
	 * Google Sheets 동기화
	 */
	export async function syncToGoogleSheets(
		limit = 100
	): Promise<SpreadsheetApiResponse> {
		return await callInternalApi<SpreadsheetApiData>("/api/spreadsheet", {
			method: "GET",
			params: {
				format: "google",
				limit,
			},
		});
	}

	/**
	 * 두 형식 모두 처리
	 */
	export async function processBothFormats(
		limit = 100,
		download = false
	): Promise<SpreadsheetApiResponse> {
		return await callInternalApi<SpreadsheetApiData>("/api/spreadsheet", {
			method: "GET",
			params: {
				format: "both",
				limit,
				download,
			},
		});
	}

	/**
	 * 스프레드시트 상태 확인
	 */
	export async function getSpreadsheetStatus(): Promise<SpreadsheetApiResponse> {
		return await callInternalApi<SpreadsheetApiData>("/api/spreadsheet", {
			method: "GET",
			params: {
				format: "google",
				limit: 1,
			},
		});
	}

	/**
	 * Google Sheets 웹훅 처리
	 */
	export async function processWebhook(webhookData: {
		eventType: string;
		spreadsheetId: string;
		sheetName: string;
		header: string;
		id: string;
		oldValue: unknown;
		newValue: unknown;
		timestamp: string;
		[key: string]: unknown;
	}): Promise<SpreadsheetApiResponse> {
		return await callInternalApi<SpreadsheetApiData>("/api/spreadsheet", {
			method: "POST",
			body: webhookData,
		});
	}
}
