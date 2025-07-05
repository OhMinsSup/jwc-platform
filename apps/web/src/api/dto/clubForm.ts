import { FormSchema, SharedPaginationDocumentSchema } from "@jwc/schema";
import { z } from "zod";

// ------------------ Response ------------------

export const ClubFormResponseSchema = z.object({
	success: z.boolean(),
	data: z.union([z.string(), z.number().int()]).nullish(),
	message: z.string(),
	isNew: z.boolean().optional(),
});

export type ClubFormResponseSchema = z.infer<typeof ClubFormResponseSchema>;
