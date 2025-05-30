"use server";
import { appRouter } from "@jwc/api";
import { env } from "@jwc/payload/env";
import type { Form } from "@jwc/schema";
import { call } from "@orpc/server";
import payloadConfig from "@payload-config";
import * as Sentry from "@sentry/nextjs";
import { headers } from "next/headers";

export type State = {
	readonly success: boolean;
	readonly message: string;
	readonly data?: string | number | null | undefined;
} | null;

export async function serverAction(
	_: State,
	formData: Form
): Promise<NonNullable<State>> {
	try {
		const heads = new Headers(await headers());
		heads.set("x-orpc-source", "rsc");
		return await call(appRouter.forms.upsert, formData, {
			context: {
				headers: heads,
				payloadConfig,
			},
		});
	} catch (error) {
		if (env.NODE_ENV === "development") {
			console.error(error);
		} else if (error instanceof Error) {
			Sentry.logger.error(error.message, {
				name: "upsert",
				action: "serverAction",
			});
			Sentry.captureException(error, {
				tags: {
					name: "upsert",
					action: "serverAction",
				},
			});
		}

		return {
			success: false,
			message: "An error occurred while processing the form.",
			data: null,
		} as const;
	}
}

export async function upsert(state: State, body: Form) {
	// const func = serverAction.bind(null, state, body);
	return await Sentry.withServerActionInstrumentation(
		"upsertAction",
		{
			headers: await headers(),
			recordResponse: true,
		},
		() => serverAction(state, body)
	);
}
