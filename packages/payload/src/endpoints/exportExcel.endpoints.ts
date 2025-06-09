import { ExcelManager } from "@jwc/excel";
import { env } from "@jwc/payload/env";
import * as Sentry from "@sentry/nextjs";
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
			"청년부 연합 여름 수련회 참가자 명단",
			docs
		);

		const arrayBufferLike = new Uint8Array(buffer);

		return new Response(arrayBufferLike, {
			headers: headersWithCors({
				headers: new Headers({
					"Content-Type":
						"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
					"Content-Disposition":
						'attachment; filename="청년부_연합_여름_수련회_참가자_명단.xlsx"',
				}),
				req: request,
			}),
		});
	} catch (error) {
		if (env.NODE_ENV === "development") {
			request.payload.logger.error(error);
		} else if (error instanceof Error) {
			Sentry.logger.error(error.message, {
				name: "exportExcelEndpoints",
				action: "endpoints",
			});
			Sentry.captureException(error, {
				tags: {
					name: "exportExcelEndpoints",
					action: "endpoints",
				},
			});
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
