import { describe, expect, it } from "vite-plus/test";

import { keysOf } from "../src/object";

describe(keysOf, () => {
	it("returns the declared keys in insertion order", () => {
		const record = { draft: 1, open: 2, closed: 3 } as const;
		expect(keysOf(record)).toStrictEqual(["draft", "open", "closed"]);
	});

	it("returns an empty list for an empty record", () => {
		expect(keysOf({})).toStrictEqual([]);
	});
});
