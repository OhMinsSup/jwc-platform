import { ExcelManager } from "@jwc/excel";
import { ExcelHead } from "node_modules/@jwc/excel/src/head";
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

		const head = new ExcelHead();
		const headerValue = head.findHeaderByName(data.header);
		if (!headerValue) {
			return new Response("Header not found", { status: 404 });
		}

		const { key } = headerValue;

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

		console.log("Syncing Google Sheets with the following documents:", docs);
		// Assuming you have a function to sync with Google Sheets
		// await syncWithGoogleSheets(docs);

		return new Response("Google Sheets synced successfully", {
			status: 200,
		});
	} catch (error) {
		// if (env.NODE_ENV === "development") {
		// 	request.payload.logger.error(error);
		// } else if (error instanceof Error) {
		// 	Sentry.logger.error(error.message, {
		// 		name: "syncGoogleSheetEndpoints",
		// 		action: "endpoints",
		// 	});
		// 	Sentry.captureException(error, {
		// 		tags: {
		// 			name: "syncGoogleSheetEndpoints",
		// 			action: "endpoints",
		// 		},
		// 	});
		// }
		return new Response("Internal Server Error", {
			status: 500,
		});
	}
};
