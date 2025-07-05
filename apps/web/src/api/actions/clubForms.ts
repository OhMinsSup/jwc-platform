"use server";
import { log } from "@jwc/observability/log";
import { ClubFormSchema } from "@jwc/schema";
import { onError } from "@orpc/client";
import payloadConfig from "@payload-config";
import { headers } from "next/headers";
import { pub } from "~/api/orpc";
import { upsertClubForm as upsertClubFormService } from "~/api/services/club";
import { ClubFormResponseSchema } from "../dto/clubForm";

export const upsertClubForm = pub
	.input(ClubFormSchema)
	.output(ClubFormResponseSchema)
	.handler(
		async ({ context, input }) =>
			await upsertClubFormService(context.payload, input)
	)
	.actionable({
		context: async () => ({
			headers: await headers(),
			payloadConfig,
		}),
		interceptors: [
			onError(async (ctx) => {
				log.error("serverActions", ctx, {
					name: "upsertClub",
					action: "serverAction",
				});
			}),
		],
	});
