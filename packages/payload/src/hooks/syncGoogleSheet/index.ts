import { GoogleSheetSyncer } from "@jwc/payload/actions/googleSheetSyncer";
import { env } from "@jwc/payload/env";
import type { Form } from "@jwc/payload/helpers/google";
import * as Sentry from "@sentry/nextjs";
import { type CollectionAfterChangeHook, getPayload } from "payload";

export const syncGoogleSheet: CollectionAfterChangeHook<Form> = async ({
	doc,
	req,
}) => {
	try {
		const [forms, sheets] = await Promise.all([
			GoogleSheetSyncer.getForms(req.payload),
			GoogleSheetSyncer.getSheets(req.payload),
		]);

		const sheet = sheets.at(-1);

		const syncer = new GoogleSheetSyncer()
			.setForms(forms.concat(doc))
			.setSheet(sheet)
			.setPayload(req.payload);

		await syncer.sync();
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
