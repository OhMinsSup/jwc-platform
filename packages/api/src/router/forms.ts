import { type Form, FormSchema } from "@jwc/schema";
import { $google, createFormSheetHeaders } from "../middlewares/google";
import { pub } from "../orpc";
import { FormResponseSchema } from "./forms/forms.dto";
import { $forms } from "./forms/forms.middleware";

export const upsert = pub
	.use($forms)
	.use($google)
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

		if (success && context.doc && context.sheet) {
			try {
				const rowData = createFormSheetHeaders().reduce(
					(acc, header) => {
						const key = header.key as keyof Form;

						acc[key] = input[key] || "";

						return acc;
					},
					{
						timestamp: new Date().toLocaleDateString(),
					} as Record<string, string | boolean | number>
				);

				console.log("Row Data", rowData);

				const row = await context.sheet.addRow(rowData, {
					insert: true,
				});

				console.log("Larry Row", row);
			} catch (error) {
				console.error("Error adding row to Google Sheet", error);
			}
		}

		return {
			success,
			data: data.id,
			message,
		};
	});
