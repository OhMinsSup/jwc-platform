import { z } from "zod/v4";

export const SharedPaginationSchema = z.object({
	limit: z.number().min(1).max(500).nullish(),
	cursor: z.number().nullish(),
});

export const SharedDraftSchema = z.object({
	draft: z.boolean().optional(),
});

export const SharedPaginationDocumentSchema = z.object({
	hasNextPage: z.boolean(),
	hasPrevPage: z.boolean(),
	limit: z.number().int(),
	nextPage: z.number().int().nullish(),
	page: z.number().int().nullish(),
	pagingCounter: z.number().int(),
	prevPage: z.number().int().nullish(),
	totalDocs: z.number().int(),
	totalPages: z.number().int(),
});

export const SharedDateTimeSchema = z
	.object({
		createdAt: z.string(),
		updatedAt: z.string(),
	})
	.partial();
