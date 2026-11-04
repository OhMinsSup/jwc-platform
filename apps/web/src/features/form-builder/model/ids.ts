import type { FormDefinition } from "@jwc/form-core/definition/definition";

/** 새로 만드는 항목의 id 접두사. 모두 form-core의 id 패턴을 만족한다. */
export const ID_PREFIX = {
	field: "q",
	page: "page",
	option: "opt",
} as const;

/** prefix_1, prefix_2 ... 중 아직 쓰이지 않은 첫 번째 */
export function uniqueId(prefix: string, taken: ReadonlySet<string>): string {
	for (let n = 1; n <= taken.size + 1; n += 1) {
		const candidate = `${prefix}_${n}`;
		if (!taken.has(candidate)) {
			return candidate;
		}
	}
	throw new Error("unreachable: pigeonhole guarantees a free id");
}

export function nextFieldId(definition: FormDefinition): string {
	return uniqueId(
		ID_PREFIX.field,
		new Set(definition.fields.map((field) => field.id)),
	);
}

export function nextPageId(definition: FormDefinition): string {
	return uniqueId(
		ID_PREFIX.page,
		new Set(definition.pages.map((page) => page.id)),
	);
}
