import { ExcelManager } from "@jwc/excel";
import { log } from "@jwc/observability/log";
import { env } from "@jwc/payload/env";
import { APIError, headersWithCors } from "payload";
import type { PayloadRequest } from "payload";

export const exportExcelEndpoints = async (request: PayloadRequest) => {
	try {
		const result = await request.payload.auth({
			headers: request.headers,
		});

		if (!result.user) {
			throw new APIError("Unauthorized", 401, {
				name: "exportExcelEndpoints",
				action: "endpoints",
			});
		}

		const { docs } = await request.payload.find({
			collection: "forms",
			limit: 100,
			req: request,
			sort: "-createdAt",
		});

		const buffer = await ExcelManager.buildExcelFileBuffer(
			env.GOOGLE_SHEET_TITLE,
			docs
		);

		const arrayBufferLike = new Uint8Array(buffer);

		return new Response(arrayBufferLike, {
			headers: headersWithCors({
				headers: new Headers({
					"Content-Type":
						"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
					"Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent("청년부_연합_여름_수련회_참가자_명단.xlsx")}`,
				}),
				req: request,
			}),
		});
	} catch (error) {
		log.error("endpoints", error as Error, {
			name: "exportExcelEndpoints",
			action: "payload.endpoints.exportExcel",
		});

		if (error instanceof APIError) {
			throw error;
		}

		throw new APIError(
			"Failed to export Excel file",
			500,
			{
				name: "exportExcelEndpoints",
				action: "endpoints",
				error: error instanceof Error ? error.name : "Unknown error",
			},
			true
		);
	}
};
