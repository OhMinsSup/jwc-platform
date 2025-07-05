import { IdSchema } from "~/api/dto/shared";
import { pub } from "~/api/orpc";
import { getAllClubs, getClubById } from "~/api/services/club";

export const getAll = pub
	.route({
		method: "GET",
		path: "/clubs",
		summary: "Clubs API",
		tags: ["Clubs"],
	})
	.handler((ctx) => getAllClubs(ctx.context.payload));

export const getById = pub
	.route({
		method: "GET",
		path: "/clubs/{id}",
		summary: "Get Club by ID",
		tags: ["Clubs"],
	})

	.input(IdSchema)
	.handler((ctx) => {
		const { id } = ctx.input;
		return getClubById(ctx.context.payload, id);
	});

export const upsert = pub
	.route({
		method: "POST",
		path: "/clubs",
		summary: "Create or Update Club",
		tags: ["Clubs"],
	})

	.input(IdSchema)
	.handler((ctx) => {
		const { id } = ctx.input;
		return getClubById(ctx.context.payload, id);
	});
