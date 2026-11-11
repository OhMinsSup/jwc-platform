import { describe, expect, it } from "vite-plus/test";

import { bindSubmissionStore } from "../src/bound";
import { contractDefinition } from "../src/contract";
import { createMemorySubmissionStore } from "../src/memory";

describe(bindSubmissionStore, () => {
	it("묶은 공간에만 읽고 쓴다 (다른 공간은 비어 있다)", async () => {
		const store = createMemorySubmissionStore();
		const definition = contractDefinition();
		const a = bindSubmissionStore(store, { collection: "a", definition });
		const b = bindSubmissionStore(store, { collection: "b", definition });
		await a.put({
			id: "s1",
			answers: {},
			paid: false,
			submittedAt: 0,
		});
		await a.setPaid("s1", true);
		await expect(a.get("s1")).resolves.toMatchObject({ id: "s1", paid: true });
		await expect(b.list()).resolves.toStrictEqual([]);
	});
});
