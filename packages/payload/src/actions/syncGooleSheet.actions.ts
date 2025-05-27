"use server";
import { syncGoogleSpreadsheet } from "@jwc/payload/helpers/google";
import payloadConfig from "@jwc/payload/payload.config";
import * as Sentry from "@sentry/nextjs";
import { headers } from "next/headers";
import { getPayload } from "payload";
import { env } from "../env";

export type State = {
	readonly success: boolean;
	readonly message: string;
} | null;

export async function serverAction(_: State): Promise<NonNullable<State>> {
	const payload = await getPayload({
		config: payloadConfig,
	});

	try {
		const { docs } = await payload.find({
			collection: "forms",
			limit: 100,
		});

		if (docs && docs.length > 0) {
			const sheet = await syncGoogleSpreadsheet(docs);
			payload.logger.info("Google Sheet updated successfully:", sheet.sheetId);
		}

		return {
			success: true,
			message: "Google Sheet Sync Success",
		};
	} catch (error) {
		if (error instanceof Error) {
			Sentry.logger.error(error.message, {
				name: "SyncGoogleSheet",
				action: "serverAction",
			});
			Sentry.captureException(error, {
				tags: {
					name: "SyncGoogleSheet",
					action: "serverAction",
				},
			});
		}
		return {
			success: false,
			message: "An error occurred while processing the form.",
		} as const;
	}
}

export async function syncGoogleSheet(state: State) {
	return await Sentry.withServerActionInstrumentation(
		"syncGoogleSheetAction",
		{
			headers: await headers(),
			recordResponse: true,
		},
		() => serverAction(state)
	);
}
