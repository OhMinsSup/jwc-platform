import { gapi } from "@jwc/google";
import { env } from "@jwc/payload/env";
import { mergedDocs } from "@jwc/payload/helpers/mergedDocs";
import * as Sentry from "@sentry/nextjs";
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
		if (env.NODE_ENV === "development") {
			req.payload.logger.error(error);
		} else if (error instanceof Error) {
			Sentry.logger.error(error.message, {
				name: "syncGoogleSheet",
				action: "collectionAfterChangeHook",
			});
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
