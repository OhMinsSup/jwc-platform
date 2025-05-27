import { env } from "@jwc/payload/env";
import { syncGoogleSpreadsheet } from "@jwc/payload/helpers/google";
import type { Form } from "@jwc/payload/payload-types";
import * as Sentry from "@sentry/nextjs";
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
		if (env.NODE_ENV === "development") {
			req.payload.logger.error(error);
		} else {
			Sentry.captureException(error, {
				tags: {
					component: "syncGoogleSheet",
					action: "collectionAfterChangeHook",
				},
			});
		}
	}

	return doc;
};
