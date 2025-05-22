import { os } from "@orpc/server";
import { type Payload, type SanitizedConfig, getPayload } from "payload";
import type { ORPCCOntextType } from "../orpc";

export type PayloadMiddlewareContext = ORPCCOntextType & {
	payload?: Payload;
};

export const $payload = os
	.$context<PayloadMiddlewareContext>()
	.middleware(async ({ context, next }) => {
		const payload =
			context.payload ??
			(await getPayload({
				config: context.payloadConfig,
			}));

		return next({
			context: {
				payload,
			},
		});
	});
