import { os, ORPCError } from "@orpc/server";
import type { User } from "payload";
import type { PayloadMiddlewareContext } from "~/api/middlewares/payload";
import type { ORPCCOntextType } from "~/api/orpc";

export type AuthMiddlewareContext = ORPCCOntextType &
	PayloadMiddlewareContext & {
		user?: User;
	};

export const $auth = os
	.$context<AuthMiddlewareContext>()
	.middleware(async ({ context, next }) => {
		if (!context.payload) {
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: "Payload not found",
			});
		}

		const result = await context.payload.auth({
			headers: context.headers,
		});

		const { user } = result;

		if (!user) {
			throw new ORPCError("UNAUTHORIZED", {
				message: "User already logged out",
			});
		}

		return next({
			context: {
				user,
			},
		});
	});
