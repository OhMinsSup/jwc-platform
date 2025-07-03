import { log } from "@jwc/observability/log";
import { env } from "@jwc/payload/env";
import {
	SpreadsheetWebhookUtils,
	type WebhookBody,
} from "@jwc/payload/utils/spreadsheet-webhook.utils";
import {
	DataConverter,
	GoogleSheetsSyncManager,
	createSpreadsheet,
} from "@jwc/spreadsheet";
import { APIError, headersWithCors } from "payload";
import type { PayloadRequest } from "payload";

/**
 * 통합 스프레드시트 관리 endpoint
 * Excel과 Google Sheets를 동시에 처리하는 통합 기능을 제공합니다.
 * GET: 스프레드시트 생성/동기화
 * POST: Google Sheets 웹훅 처리
 */
export const spreadsheetEndpoints = async (request: PayloadRequest) => {
	try {
		// HTTP 메서드에 따라 다른 처리
		if (request.method === "POST") {
			return await handleWebhook(request);
		}

		return await handleSpreadsheetRequest(request);
	} catch (error) {
		log.error("endpoints", error as Error, {
			name: "spreadsheetEndpoints",
			action: "payload.endpoints.spreadsheet",
		});

		if (error instanceof APIError) {
			throw error;
		}

		throw new APIError(
			"Failed to process spreadsheet request",
			500,
			{
				name: "spreadsheetEndpoints",
				action: "endpoints",
				error: error instanceof Error ? error.message : "Unknown error",
			},
			true
		);
	}
};

/**
 * 스프레드시트 생성/동기화 처리 (GET)
 */
async function handleSpreadsheetRequest(request: PayloadRequest) {
	// 인증 확인
	const result = await request.payload.auth({
		headers: request.headers,
	});

	if (!result.user) {
		throw new APIError("Unauthorized", 401, {
			name: "handleSpreadsheetRequest",
			action: "endpoints",
		});
	}

	// 쿼리 파라미터 확인
	const url = new URL(request.url || "");
	const format = url.searchParams.get("format") || "both"; // excel, google, both
	const limit = Number.parseInt(url.searchParams.get("limit") || "100", 10);
	const download = url.searchParams.get("download") === "true";

	// 데이터 조회
	const { docs } = await request.payload.find({
		collection: "forms",
		limit,
		req: request,
		sort: "-createdAt",
	});

	// 데이터를 RowFormData 형식으로 변환
	const formData = docs.map((doc) => DataConverter.toRowFormData(doc));

	const fileName = "청년부_연합_여름_수련회_참가자_명단";
	const spreadsheet = createSpreadsheet().withData(formData);

	// 요청한 형식에 따라 처리
	switch (format) {
		case "excel":
			if (download) {
				// Excel 파일 다운로드
				const { excel } = await spreadsheet
					.withExcel(`${fileName}.xlsx`, "참가자명단", true)
					.execute();

				if (!excel) {
					throw new APIError("Failed to generate Excel file", 500);
				}

				const arrayBufferLike = new Uint8Array(excel.buffer);
				const encodedName = encodeURIComponent(`${fileName}.xlsx`);

				return new Response(arrayBufferLike, {
					headers: headersWithCors({
						headers: new Headers({
							"Content-Type":
								"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
							"Content-Disposition": `attachment; filename*=UTF-8''${encodedName}`,
						}),
						req: request,
					}),
				});
			}

			// Excel 생성만 (응답으로 상태 반환)
			await spreadsheet
				.withExcel(`${fileName}.xlsx`, "참가자명단", true)
				.execute();

			return Response.json({
				success: true,
				message: "Excel file generated successfully",
				format: "excel",
				recordCount: formData.length,
			});

		case "google":
			// Google Sheets 동기화
			await spreadsheet
				.withGoogleSheetsFromEnv(env.GOOGLE_SHEET_TITLE)
				.execute();

			return Response.json({
				success: true,
				message: "Google Sheets synchronized successfully",
				format: "google",
				recordCount: formData.length,
				sheetUrl: `https://docs.google.com/spreadsheets/d/${env.GOOGLE_SHEET_ID}`,
			});

		default:
			if (download) {
				// Excel 파일 다운로드 + Google Sheets 동기화
				const { excel } = await spreadsheet
					.withExcel(`${fileName}.xlsx`, "참가자명단", true)
					.withGoogleSheetsFromEnv(env.GOOGLE_SHEET_TITLE)
					.execute();

				if (!excel) {
					throw new APIError("Failed to generate Excel file", 500);
				}

				const arrayBufferLike = new Uint8Array(excel.buffer);
				const encodedName = encodeURIComponent(`${fileName}.xlsx`);

				return new Response(arrayBufferLike, {
					headers: headersWithCors({
						headers: new Headers({
							"Content-Type":
								"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
							"Content-Disposition": `attachment; filename*=UTF-8''${encodedName}`,
							"X-Google-Sheets-Synced": "true",
							"X-Google-Sheets-Url": `https://docs.google.com/spreadsheets/d/${env.GOOGLE_SHEET_ID}`,
						}),
						req: request,
					}),
				});
			}

			// Excel과 Google Sheets 모두 처리 (응답으로 상태 반환)
			await spreadsheet
				.withExcel(`${fileName}.xlsx`, "참가자명단", true)
				.withGoogleSheetsFromEnv(env.GOOGLE_SHEET_TITLE)
				.execute();

			return Response.json({
				success: true,
				message: "Excel and Google Sheets processed successfully",
				format: "both",
				recordCount: formData.length,
				sheetUrl: `https://docs.google.com/spreadsheets/d/${env.GOOGLE_SHEET_ID}`,
			});
	}
}

/**
 * Google Sheets 웹훅 처리 (POST)
 */
async function handleWebhook(request: PayloadRequest) {
	// @ts-expect-error request.json() type issue
	const data: WebhookBody = await request.json();

	// 웹훅 데이터 처리
	const { key, parsedValue } = SpreadsheetWebhookUtils.processWebhookData(data);

	// 데이터베이스 업데이트
	await request.payload.update({
		collection: "forms",
		id: data.id,
		data: { [key]: parsedValue },
		req: request,
	});

	// 전체 데이터 조회
	const { docs } = await request.payload.find({
		collection: "forms",
		limit: 100,
		req: request,
		sort: "-createdAt",
	});

	// Google Sheets 동기화 매니저 생성
	const syncManager = new GoogleSheetsSyncManager();

	// 데이터를 RowFormData 형식으로 변환
	const formData = docs.map((doc) => DataConverter.toRowFormData(doc));

	// Google Sheets에 동기화
	await syncManager.setDocs(formData).syncToGoogleSheets();

	return Response.json({
		success: true,
		message: `Successfully synced Google Sheet for header "${data.header}"`,
		recordCount: formData.length,
	});
}
