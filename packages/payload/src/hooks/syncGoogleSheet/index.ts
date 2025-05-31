import { GoogleSheetSyncer } from "@jwc/payload/actions/googleSheetSyncer";
import { env } from "@jwc/payload/env";
import * as Sentry from "@sentry/nextjs";
import type { CollectionAfterChangeHook } from "payload";
import type { Form } from "../../types";

export const syncGoogleSheet: CollectionAfterChangeHook<Form> = async ({
	doc,
	req,
}) => {
	try {
		const forms = await GoogleSheetSyncer.getForms(req.payload);

		console.log("syncGoogleSheet: forms", forms.concat(doc));
		const syncer = new GoogleSheetSyncer()
			.setForms(forms.concat(doc))
			.setPayload(req.payload);

		await syncer.sync("sheet");
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
