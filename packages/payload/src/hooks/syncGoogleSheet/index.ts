import { gapi } from "@jwc/google";
import { log } from "@jwc/observability/log";
import { mergedDocs } from "@jwc/payload/helpers/mergedDocs";
import type { CollectionAfterChangeHook } from "payload";
import type { Form } from "../../types";

export const syncGoogleSheet: CollectionAfterChangeHook<Form> = async ({
	doc,
	req,
}) => {
	try {
		const { docs } = await req.payload.find({
			collection: "forms",
			limit: 100,
			sort: "-createdAt",
		});

		await gapi
			.setDocs(mergedDocs(docs as Form[], doc))
			.upsertGoogleSheetTable();
	} catch (error) {
		log.error("collectionHooks", error as Error, {
			name: "syncGoogleSheet",
			action: "payload.collectionAfterChangeHook",
		});
	}

	return doc;
};
