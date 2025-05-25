import type { Form } from "@jwc/payload/payload-types";
import type { CollectionAfterChangeHook } from "payload";

export const syncGoogleSheet: CollectionAfterChangeHook<Form> = async ({
	doc,
	req,
}) => {
	try {
		await req.payload.jobs.queue({
			task: "syncGoogleSheet",
			input: {},
		});
	} catch (error) {
		req.payload.logger.error("[collection hook]: google sheet sync", error);
	}

	return doc;
};
