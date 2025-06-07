import { ExcelManager } from "@jwc/excel";
import { gapi } from "@jwc/google";
import { env } from "@jwc/payload/env";
import * as Sentry from "@sentry/nextjs";
import type { PayloadRequest } from "payload";

type Body = {
	eventType: string;
	spreadsheetId: string;
	sheetName: string;
	range: string;
	row: number;
	column: number;
	header: string; // Assuming 'header' is a string, adjust type as necessary
	id: string; // Assuming 'id' is a string, adjust type as necessary
	oldValue: unknown; // Adjust type as necessary
	newValue: unknown; // Adjust type as necessary
	timestamp: string;
	[key: string]: unknown;
};

export const syncGoogleSheetEndpoints = async (request: PayloadRequest) => {
	try {
		// @ts-expect-error request.payload is not defined in the type
		const data: Awaited<Body> = await request.json();
		if (!data.id) {
			return Response.json(
				{
					ok: false,
					error: "ID is required",
				},
				{
					status: 404,
				}
			);
		}

		const headerValue = ExcelManager.findHeaderByName(data.header);
		if (!headerValue) {
			return Response.json(
				{
					ok: false,
					error: `Header "${data.header}" not found`,
				},
				{
					status: 404,
				}
			);
		}

		const { key } = headerValue;
		if (key) {
			await request.payload.update({
				collection: "forms",
				id: data.id,
				data: {
					[key as string]: data.newValue,
				},
				req: request,
			});

			const { docs } = await request.payload.find({
				collection: "forms",
				limit: 100,
				req: request,
			});

			await gapi.setDocs(docs).upsertGoogleSheetTable();

			return Response.json(
				{
					ok: true,
					message: `Successfully google sheet synced for header "${data.header}"`,
				},
				{
					status: 200,
				}
			);
		}

		return Response.json(
			{
				ok: false,
				error: `Header "${data.header}" not found in the ExcelHead`,
			},
			{
				status: 404,
			}
		);
	} catch (error) {
		if (env.NODE_ENV === "development") {
			request.payload.logger.error(error);
		} else if (error instanceof Error) {
			Sentry.logger.error(error.message, {
				name: "syncGoogleSheetEndpoints",
				action: "endpoints",
			});
			Sentry.captureException(error, {
				tags: {
					name: "syncGoogleSheetEndpoints",
					action: "endpoints",
				},
			});
		}

		return Response.json(
			{
				ok: false,
				error: "Internal Server Error",
			},
			{
				status: 500,
			}
		);
	}
};
