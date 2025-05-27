import { syncGoogleSpreadsheet } from "@jwc/payload/helpers/google";
import type { Form } from "@jwc/payload/payload-types";
import type { CollectionAfterChangeHook } from "payload";

export const syncGoogleSheet: CollectionAfterChangeHook<Form> = async ({
	doc,
	req,
}) => {
	try {
		const { docs } = await req.payload.find({
			collection: "forms",
			limit: 100,
		});

		if (docs && docs.length > 0) {
			const sheet = await syncGoogleSpreadsheet(docs);
			req.payload.logger.info(
				"Google Sheet updated successfully",
				sheet.sheetId
			);
		}
	} catch (error) {
		req.payload.logger.error("[collection SyncGoogleSheet]");
		if (error instanceof Error) {
			req.payload.logger.error(error.name);
			req.payload.logger.error(error.message);
			req.payload.logger.error(error);
		}
	}

	return doc;
};
