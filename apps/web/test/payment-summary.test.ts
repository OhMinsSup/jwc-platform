import { describe, expect, it } from "vite-plus/test";

import { summarizePayment } from "../src/features/submissions/model/payment";

const FULL = 65_000;
const DAY = 35_000;

describe(summarizePayment, () => {
	it("합계는 행에서 계산하고, 미납 금액 = 받을 금액 - 받은 금액", () => {
		const summary = summarizePayment([
			{ amount: FULL, group: "3박4일", paid: true },
			{ amount: FULL, group: "3박4일", paid: false },
			{ amount: DAY, group: "무박", paid: false },
		]);
		expect(summary).toMatchObject({
			total: 3,
			paidCount: 1,
			unpaidCount: 2,
			expected: FULL * 2 + DAY,
			collected: FULL,
			outstanding: FULL + DAY,
			unknownAmount: 0,
		});
	});

	it("그룹은 1인 금액이 큰 순서, 그룹마다 인원과 납입 인원", () => {
		const { groups } = summarizePayment([
			{ amount: DAY, group: "무박", paid: true },
			{ amount: FULL, group: "3박4일", paid: false },
			{ amount: FULL, group: "3박4일", paid: true },
		]);
		expect(groups).toStrictEqual([
			{ label: "3박4일", amount: FULL, count: 2, paidCount: 1 },
			{ label: "무박", amount: DAY, count: 1, paidCount: 1 },
		]);
	});

	it("금액을 알 수 없는 응답은 합계에서 빼고 따로 센다", () => {
		const summary = summarizePayment([
			{ amount: null, group: null, paid: false },
			{ amount: FULL, group: null, paid: false },
		]);
		expect(summary.expected).toBe(FULL);
		expect(summary.unknownAmount).toBe(1);
		expect(summary.groups.map((g) => g.label)).toStrictEqual(["전체"]);
	});

	it("응답이 없으면 모두 0", () => {
		expect(summarizePayment([])).toMatchObject({
			total: 0,
			expected: 0,
			outstanding: 0,
			groups: [],
		});
	});
});
