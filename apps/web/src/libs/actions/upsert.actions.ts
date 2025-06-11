"use server";
import { appRouter } from "@jwc/api";
import { log } from "@jwc/observability/log";
import type { Form } from "@jwc/schema";
import { call } from "@orpc/server";
import payloadConfig from "@payload-config";
import { withServerActionInstrumentation } from "@sentry/nextjs";
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
		log.error("serverActions", error as Error, {
			name: "upsert",
			action: "serverAction",
		});
		return {
			success: false,
			message: "An error occurred while processing the form.",
			data: null,
		} as const;
	}
}

export async function upsert(state: State, body: Form) {
	return await withServerActionInstrumentation(
		"upsertAction",
		{
			headers: await headers(),
			recordResponse: true,
		},
		() => serverAction(state, body)
	);
}
