"use server";
import payloadConfig from "@jwc/payload/payload.config";
import * as Sentry from "@sentry/nextjs";
import { headers } from "next/headers";
import { getPayload } from "payload";

export type State = {
	readonly success: boolean;
	readonly message: string;
} | null;

export async function serverAction(_: State): Promise<NonNullable<State>> {
	const payload = await getPayload({
		config: payloadConfig,
	});

	try {
		await payload.jobs.queue({
			task: "syncGoogleSheet",
			input: {},
		});
		return {
			success: true,
			message: "Google Sheet Sync Success",
		};
	} catch (error) {
		payload.logger.error("[serverAction]: google sheet sync", error);
		return {
			success: false,
			message: "An error occurred while processing the form.",
		} as const;
	}
}

export async function syncGoogleSheetAction(state: State) {
	return await Sentry.withServerActionInstrumentation(
		"syncGoogleSheetAction",
		{
			headers: await headers(),
			recordResponse: true,
		},
		() => serverAction(state)
	);
}
