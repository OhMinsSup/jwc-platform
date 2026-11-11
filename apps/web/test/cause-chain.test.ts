import { describe, expect, it } from "vite-plus/test";

import { causeChain } from "../src/platform/server/errors/cause-chain";

describe(causeChain, () => {
	it("바깥 오류부터 원인 순서로 나열한다", () => {
		const inner = new Error("inner");
		const outer = new Error("outer", { cause: inner });
		expect(causeChain(outer)).toStrictEqual([outer, inner]);
	});

	it("순환하는 cause에서도 끝난다 (오류 자신 + 원인 3개까지)", () => {
		const a = new Error("a");
		const b = new Error("b", { cause: a });
		Object.assign(a, { cause: b });
		expect(causeChain(a)).toHaveLength(4);
	});
});
