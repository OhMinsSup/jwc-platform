import { FormSchema, SharedPaginationDocumentSchema } from "@jwc/schema";
import { z } from "zod";

// ------------------ Response Pagination ------------------

const Id = z
	.union([z.string().min(1), z.number().int().min(1)])
	.transform((value) =>
		typeof value === "string" ? Number.parseInt(value, 10) : value
	);

export const IdSchema = z.object({
	id: Id,
});
