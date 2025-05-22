import { FormSchema, SharedPaginationDocumentSchema } from "@jwc/schema";
import { z } from "zod";

// ------------------ Response Pagination ------------------

export const FormPaginationDocumentSchema = z
	.object({
		data: FormSchema,
	})
	.merge(SharedPaginationDocumentSchema);

export type FormPaginationDocumentSchemaResponse = z.infer<
	typeof FormPaginationDocumentSchema
>;

// ------------------ Response ------------------

export const FormResponseSchema = z.object({
	success: z.boolean(),
	data: z.union([z.string(), z.number().int()]).nullish(),
	message: z.string(),
});

export type FormResponseSchema = z.infer<typeof FormResponseSchema>;
