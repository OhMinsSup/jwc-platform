import slugifyCJK from "cjk-slug";
import type { FieldHook } from "payload";
import slugify from "slugify";

export function format(text: string) {
	return slugify(
		slugifyCJK(text, {
			lowercase: true,
		}),
		{ trim: true, lower: true }
	);
}

export const formatSlug =
	(fallback: string): FieldHook =>
	({ data, operation, originalDoc, value }) => {
		if (typeof value === "string") {
			return format(value);
		}

		if (operation === "create") {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
			const fallbackData = data?.[fallback] || originalDoc?.[fallback];

			if (fallbackData && typeof fallbackData === "string") {
				return format(fallbackData);
			}
		}

		return value as unknown as string;
	};
