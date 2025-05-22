import { os, ORPCError } from "@orpc/server";
import type { PayloadMiddlewareContext } from "../../middlewares/payload";
import type { ORPCCOntextType } from "../../orpc";
import { FormsRepository } from "./forms.repository";
import { FormsService } from "./forms.service";

type FormsMiddlewareContext = ORPCCOntextType &
	PayloadMiddlewareContext & {
		formsService?: FormsService;
	};

export const $forms = os
	.$context<FormsMiddlewareContext>()
	.middleware(({ context, next }) => {
		if (!context.payload) {
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: "Payload not found",
			});
		}

		const formsService =
			context.formsService ??
			new FormsService(new FormsRepository(context.payload));

		return next({
			context: {
				formsService,
			},
		});
	});
