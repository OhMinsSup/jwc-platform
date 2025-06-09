import { ExcelManager } from "@jwc/excel";
import { gapi } from "@jwc/google";
import { env } from "@jwc/payload/env";
import {
	parseAttendanceDay,
	parseAttendanceTime,
	parseName,
	parseTshirtSizeText,
} from "@jwc/utils/format";
import * as Sentry from "@sentry/nextjs";
import { APIError } from "payload";
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

function parseValueByKey(key: string, value: unknown) {
	switch (key) {
		case "tshirtSize": {
			return parseTshirtSizeText(value as string);
		}
		case "attendanceDay": {
			return parseAttendanceDay(value as string);
		}
		case "attendanceTime": {
			return parseAttendanceTime(value as string);
		}
		case "carSupport": {
			return value === "지원";
		}
		case "isPaid": {
			return value === "납입";
		}
		case "name": {
			return parseName(value as string);
		}
		default: {
			return value;
		}
	}
}

export const syncGoogleSheetEndpoints = async (request: PayloadRequest) => {
	try {
		// @ts-expect-error request.payload is not defined in the type
		const data: Body = await request.json();

		if (data.spreadsheetId !== env.GOOGLE_SHEET_ID) {
			throw new APIError(
				"Invalid spreadsheet ID",
				400,
				{
					name: "syncGoogleSheetEndpoints",
					action: "endpoints",
					error: "Invalid spreadsheet ID",
				},
				true
			);
		}

		if (!data.id) {
			throw new APIError(
				"ID is required",
				404,
				{
					name: "syncGoogleSheetEndpoints",
					action: "endpoints",
					error: "ID is required",
				},
				true
			);
		}

		const header = ExcelManager.findHeaderByName(data.header);
		if (!header) {
			throw new APIError(
				`Header "${data.header}" not found in the ExcelHead`,
				404,
				{
					name: "syncGoogleSheetEndpoints",
					action: "endpoints",
					error: `Header "${data.header}" not found in the ExcelHead`,
				},
				true
			);
		}

		const { key } = header;
		if (!key) {
			throw new APIError(
				`Header "${data.header}" not found in the ExcelHead`,
				404,
				{
					name: "syncGoogleSheetEndpoints",
					action: "endpoints",
					error: `Header "${data.header}" not found in the ExcelHead`,
				},
				true
			);
		}
		if (key === "id") {
			throw new APIError(
				'Cannot sync "id" header',
				400,
				{
					name: "syncGoogleSheetEndpoints",
					action: "endpoints",
					error: 'Cannot sync "id" header',
				},
				true
			);
		}

		const newValue = parseValueByKey(key, data.newValue);

		await request.payload.update({
			collection: "forms",
			id: data.id,
			data: { [key]: newValue },
			req: request,
		});

		const { docs } = await request.payload.find({
			collection: "forms",
			limit: 100,
			req: request,
			sort: "-createdAt",
		});

		await gapi.setDocs(docs).upsertGoogleSheetTable();

		return Response.json(
			{
				ok: true,
				message: `Successfully google sheet synced for header "${data.header}"`,
			},
			{ status: 200 }
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

		throw new APIError(
			"Failed to sync Google Sheet",
			500,
			{
				name: "syncGoogleSheetEndpoints",
				action: "endpoints",
				error: error instanceof Error ? error.name : "Unknown error",
			},
			true
		);
	}
};
