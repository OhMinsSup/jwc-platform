"use server";
import { gapi } from "@jwc/google";
import { log } from "@jwc/observability/log";
import { configurePayload } from "@jwc/payload/configurePayload";
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
			sort: "-createdAt",
		});

		await gapi.setDocs(docs).upsertGoogleSheetTable();

		return {
			success: true,
			message: `Successfully synced ${docs.length} forms to Google Sheets.`,
		};
	} catch (error) {
		log.error("serverActions", error as Error, {
			name: "syncGoogleSheet",
			action: "payload.actions.syncGoogleSheet",
		});
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
