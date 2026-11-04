/**
 * 회비 납입 현황 (순수 함수): 표에 보이는 행에서 합계를 계산한다. 합계를 따로 받지 않는다.
 */

export interface PaymentRow {
	amount: number | null;
	group: string | null;
	paid: boolean;
}

interface PaymentGroupSummary {
	/** 이 그룹 1인 회비 (그룹 안에서 같다) */
	amount: number | null;
	count: number;
	label: string;
	paidCount: number;
}

export interface PaymentSummary {
	collected: number;
	expected: number;
	groups: PaymentGroupSummary[];
	outstanding: number;
	paidCount: number;
	total: number;
	/** 금액을 알 수 없는 응답 수 (옵션 미선택 등) */
	unknownAmount: number;
	unpaidCount: number;
}

/** 그룹 이름이 없는 행(고정 금액)의 그룹 */
const SINGLE_GROUP = "전체";

function addToGroup(
	groups: Map<string, PaymentGroupSummary>,
	row: PaymentRow,
): void {
	const label = row.group ?? SINGLE_GROUP;
	const group = groups.get(label) ?? {
		label,
		amount: row.amount,
		count: 0,
		paidCount: 0,
	};
	group.count += 1;
	group.paidCount += row.paid ? 1 : 0;
	groups.set(label, group);
}

/** 금액이 큰 그룹부터 (같으면 이름순) */
function byAmountDesc(a: PaymentGroupSummary, b: PaymentGroupSummary): number {
	return (b.amount ?? 0) - (a.amount ?? 0) || a.label.localeCompare(b.label);
}

export function summarizePayment(rows: readonly PaymentRow[]): PaymentSummary {
	const groups = new Map<string, PaymentGroupSummary>();
	let expected = 0;
	let collected = 0;
	let paidCount = 0;
	let unknownAmount = 0;
	for (const row of rows) {
		addToGroup(groups, row);
		paidCount += row.paid ? 1 : 0;
		if (row.amount === null) {
			unknownAmount += 1;
			continue;
		}
		expected += row.amount;
		collected += row.paid ? row.amount : 0;
	}
	return {
		total: rows.length,
		paidCount,
		unpaidCount: rows.length - paidCount,
		expected,
		collected,
		outstanding: expected - collected,
		unknownAmount,
		groups: [...groups.values()].toSorted(byAmountDesc),
	};
}
