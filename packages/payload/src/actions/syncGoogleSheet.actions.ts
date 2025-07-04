"use server";
import { log } from "@jwc/observability/log";
import {
	SpreadsheetApi,
	type SpreadsheetApiData,
} from "@jwc/payload/helpers/internal-api.utils";
import * as Sentry from "@sentry/nextjs";
import { headers } from "next/headers";

export type State = {
	readonly success: boolean;
	readonly message: string;
	readonly recordCount?: number;
	readonly sheetUrl?: string;
	readonly format?: "excel" | "google" | "both";
	readonly filename?: string;
	readonly downloadUrl?: string;
	readonly data?: ArrayBuffer; // 다른 액션에서 사용할 수도 있으므로 유지
} | null;

export async function serverAction(
	_: State,
	format: "excel" | "google" | "both" = "google"
): Promise<NonNullable<State>> {
	const result = await SpreadsheetApi.processSpreadsheet({
		format,
		limit: 100,
		download: format === "excel", // Excel 형식일 때만 다운로드 데이터 포함
	});

	if (result.success) {
		const data = result.data as SpreadsheetApiData;

		// Excel 형식일 때 파일명 생성 및 데이터 처리
		let filename: string | undefined;
		let binaryData: ArrayBuffer | undefined;

		if (format === "excel" && result.data instanceof ArrayBuffer) {
			const timestamp = new Date()
				.toISOString()
				.slice(0, 19)
				.replace(/:/g, "-");
			filename = `청년부_연합_여름_수련회_참가자_명단_${timestamp}.xlsx`;
			binaryData = result.data;
		}

		return {
			success: true,
			message:
				data?.message ||
				`Successfully processed spreadsheet in ${format} format`,
			recordCount: data?.recordCount,
			sheetUrl: data?.sheetUrl,
			format,
			filename,
			data: binaryData,
		};
	}

	return {
		success: false,
		message:
			result.message || "An error occurred while processing the spreadsheet.",
		format,
	};
}

export async function syncGoogleSheet(
	state: State,
	format: "excel" | "google" | "both" = "google"
) {
	return await Sentry.withServerActionInstrumentation(
		"syncGoogleSheetAction",
		{
			headers: await headers(),
			recordResponse: true,
		},
		() => serverAction(state, format)
	);
}

/**
 * Google Sheets 전용 동기화 액션
 */
export async function syncToGoogleSheets(state: State) {
	return await syncGoogleSheet(state, "google");
}

/**
 * Excel 생성 및 다운로드 액션
 */
export async function downloadExcelAction(state: State) {
	return await syncGoogleSheet(state, "excel");
}

/**
 * Excel + Google Sheets 동시 처리 액션
 */
export async function syncBothFormats(state: State) {
	return await syncGoogleSheet(state, "both");
}

/**
 * 데이터 개수 조회
 */
export async function getFormCountAction(): Promise<number> {
	try {
		const result = await SpreadsheetApi.getSpreadsheetStatus();
		if (result.success && result.data) {
			return result.data.recordCount || 0;
		}
		return 0;
	} catch (error) {
		log.error("serverActions", error as Error, {
			name: "getFormCount",
			action: "get-form-count",
		});
		return 0;
	}
}

/**
 * 스프레드시트 상태 확인
 */
export async function checkSpreadsheetStatusAction(): Promise<{
	totalRecords: number;
	googleSheetsUrl?: string;
	lastSync?: string;
}> {
	try {
		const result = await SpreadsheetApi.getSpreadsheetStatus();

		if (result.success && result.data) {
			return {
				totalRecords: result.data.recordCount || 0,
				googleSheetsUrl: result.data.sheetUrl,
				lastSync: new Date().toISOString(),
			};
		}

		return {
			totalRecords: 0,
			lastSync: new Date().toISOString(),
		};
	} catch (error) {
		log.error("serverActions", error as Error, {
			name: "checkSpreadsheetStatus",
			action: "check-spreadsheet-status",
		});
		return {
			totalRecords: 0,
			lastSync: new Date().toISOString(),
		};
	}
}

/**
 * Excel 파일 생성 및 다운로드
 */
export async function downloadExcelFileAction(): Promise<NonNullable<State>> {
	try {
		// 서버 액션에서는 직접 blob 데이터를 반환할 수 없으므로
		// 다운로드 URL을 반환합니다
		const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
		const filename = `청년부_연합_여름_수련회_참가자_명단_${timestamp}.xlsx`;

		// 다운로드 URL 생성 (클라이언트에서 fetch로 호출)
		const downloadUrl = "/api/spreadsheet?format=excel&download=true&limit=100";

		return {
			success: true,
			message: "Excel download URL generated successfully",
			downloadUrl,
			filename,
			format: "excel",
		};
	} catch (error) {
		log.error("serverActions", error as Error, {
			name: "downloadExcel",
			action: "download-excel",
		});
		return {
			success: false,
			message: "An error occurred while generating Excel file",
			format: "excel",
		};
	}
}
