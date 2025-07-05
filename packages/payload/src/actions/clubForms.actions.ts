"use server";

import { log } from "@jwc/observability/log";
import {
	SpreadsheetApi,
	type SpreadsheetApiData,
} from "@jwc/payload/helpers/internal-api.utils";
import * as Sentry from "@sentry/nextjs";

export type ClubFormState = {
	readonly success: boolean;
	readonly message: string;
	readonly recordCount?: number;
	readonly format?: "excel" | "google" | "both";
	readonly filename?: string;
	readonly downloadUrl?: string;
	readonly data?: ArrayBuffer;
} | null;

/**
 * 동아리 신청서 Excel 다운로드 액션
 */
export async function downloadClubFormExcelAction(): Promise<
	NonNullable<ClubFormState>
> {
	try {
		const result = await SpreadsheetApi.processSpreadsheet({
			format: "excel",
			limit: 100,
			download: true,
			type: "clubForms", // 동아리 신청서 타입 지정
		});

		if (result.success) {
			// Excel 형식일 때 파일명 생성
			const timestamp = new Date()
				.toISOString()
				.slice(0, 19)
				.replace(/:/g, "-");
			const filename = `동아리_신청자_목록_${timestamp}.xlsx`;

			// 다운로드 URL 생성 (같은 API 엔드포인트 사용)
			const downloadUrl =
				"/api/spreadsheet?format=excel&download=true&type=clubForms&limit=100";

			return {
				success: true,
				message: "동아리 신청서 Excel 파일이 성공적으로 생성되었습니다",
				recordCount: (result.data as SpreadsheetApiData)?.recordCount,
				format: "excel",
				filename,
				downloadUrl,
			};
		}

		log.error("serverActions", new Error(result.message), {
			name: "downloadClubFormExcelAction",
			action: "spreadsheet.api.error",
		});

		return {
			success: false,
			message:
				result.message ||
				"동아리 신청서 Excel 파일 생성 중 오류가 발생했습니다",
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";

		log.error("serverActions", error as Error, {
			name: "downloadClubFormExcelAction",
			action: "spreadsheet.api.exception",
		});

		Sentry.captureException(error, {
			tags: {
				action: "downloadClubFormExcelAction",
				type: "server-action",
			},
		});

		return {
			success: false,
			message: `동아리 신청서 Excel 파일 생성 중 오류가 발생했습니다: ${errorMessage}`,
		};
	}
}
