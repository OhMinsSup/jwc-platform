import { FormSchema } from "@jwc/schema";
import { pub } from "../orpc";
import { FormResponseSchema } from "./forms/forms.dto";
import { $forms } from "./forms/forms.middleware";

export const upsert = pub
	.use($forms)
	.route({
		method: "POST",
		path: "/forms",
		summary: "Upsert Forms",
		tags: ["Forms"],
	})
	.input(FormSchema)
	.output(FormResponseSchema)
	.handler(async ({ context, input }) => {
		const { success, data, message } =
			await context.formsService.upsertForm(input);
		return {
			success,
			data: data.id,
			message,
		};
	});
