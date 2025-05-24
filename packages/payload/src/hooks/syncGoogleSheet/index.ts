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
			await syncGoogleSpreadsheet(docs);
		}
	} catch (error) {
		req.payload.logger.error(
			"[collection after change hook]: google sheet sync",
			error
		);
	}

	return doc;
};
