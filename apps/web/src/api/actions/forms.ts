"use server";
import { log } from "@jwc/observability/log";
import { FormSchema } from "@jwc/schema";
import { onError } from "@orpc/client";
import payloadConfig from "@payload-config";
import { headers } from "next/headers";
import { FormResponseSchema } from "~/api/dto/form";
import { pub } from "~/api/orpc";
import { upsertFormService } from "~/api/services/form";

export const upsertForm = pub
	.input(FormSchema)
	.output(FormResponseSchema)
	.handler(
		async ({ context, input }) =>
			await upsertFormService(context.payload, input)
	)
	.actionable({
		context: async () => ({
			headers: await headers(),
			payloadConfig,
		}),
		interceptors: [
			onError(async (ctx) => {
				log.error("serverActions", ctx, {
					name: "upsertForm",
					action: "serverAction",
				});
			}),
		],
	});
