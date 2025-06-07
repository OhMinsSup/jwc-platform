"use server";
import { gapi } from "@jwc/google";
import { configurePayload } from "@jwc/payload/configurePayload";
import { env } from "@jwc/payload/env";
import * as Sentry from "@sentry/nextjs";
import { headers } from "next/headers";
import { getPayload } from "payload";

export type State = {
	readonly success: boolean;
	readonly message: string;
} | null;

export async function serverAction(_: State): Promise<NonNullable<State>> {
	const payload = await getPayload({ config: configurePayload() });

	try {
		const { docs } = await payload.find({
			collection: "forms",
			limit: 100,
		});

		await gapi.setDocs(docs).upsertGoogleSheetTable();

		return {
			success: true,
			message: `Successfully synced ${docs.length} forms to Google Sheets.`,
		};
	} catch (error) {
		if (env.NODE_ENV === "development") {
			payload.logger.error(error);
		} else if (error instanceof Error) {
			Sentry.logger.error(error.message, {
				name: "syncGoogleSheet",
				action: "serverAction",
			});
			Sentry.captureException(error, {
				tags: {
					name: "syncGoogleSheet",
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
