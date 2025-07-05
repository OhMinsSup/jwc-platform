import { ClubFormSchema } from "@jwc/schema";
import { ClubFormResponseSchema } from "~/api/dto/clubForm";
import { pub } from "~/api/orpc";
import { upsertClubForm as upsertClubFormService } from "~/api/services/club";

export const upsertClubForm = pub
	.route({
		method: "POST",
		path: "/club-forms",
		summary: "Create or Update Club Form",
		tags: ["ClubForms"],
	})
	.input(ClubFormSchema)
	.output(ClubFormResponseSchema)
	.handler(async (ctx) => {
		return await upsertClubFormService(ctx.context.payload, ctx.input);
	});
