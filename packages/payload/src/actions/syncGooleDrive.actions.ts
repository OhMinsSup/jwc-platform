"use server";
import { configurePayload } from "@jwc/payload/configurePayload";
import { env } from "@jwc/payload/env";
import * as Sentry from "@sentry/nextjs";
import { headers } from "next/headers";
import { getPayload } from "payload";
import { GoogleSheetSyncer } from "./googleSheetSyncer";

export type State = {
	readonly success: boolean;
	readonly message: string;
} | null;

export async function serverAction(_: State): Promise<NonNullable<State>> {
	const payloadPromise = await getPayload({ config: configurePayload() });

	try {
		const [forms, sheets] = await Promise.all([
			GoogleSheetSyncer.getForms(payloadPromise),
			GoogleSheetSyncer.getSheets(payloadPromise),
		]);

		if (!forms.length) {
			return {
				success: false,
				message: "No forms found to sync with Google Drive.",
			} as const;
		}

		const sheet = sheets.at(-1);

		const syncer = new GoogleSheetSyncer()
			.setForms(forms)
			.setSheet(sheet)
			.setPayload(payloadPromise);

		await syncer.sync();

		return {
			success: true,
			message: "Google Drive Sync Success",
		};
	} catch (error) {
		if (env.NODE_ENV === "development") {
			console.error(error);
		} else if (error instanceof Error) {
			Sentry.logger.error(error.message, {
				name: "syncGooleDrive",
				action: "serverAction",
			});
			Sentry.captureException(error, {
				tags: {
					name: "syncGooleDrive",
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

export async function syncGooleDrive(state: State) {
	return await Sentry.withServerActionInstrumentation(
		"syncGooleDriveAction",
		{
			headers: await headers(),
			recordResponse: true,
		},
		() => serverAction(state)
	);
}
