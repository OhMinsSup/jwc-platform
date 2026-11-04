import { describe, expect, it } from "vite-plus/test";

import { parseFormDefinition } from "../src";
import { retreat2026Definition } from "../src/samples";

const clone = () => structuredClone(retreat2026Definition);

/** 인덱스 접근 결과를 확정한다 (샘플 정의 구조가 바뀌면 테스트가 바로 실패하도록) */
function itemAt<T>(items: T[], index: number): T {
	const item = items[index];
	if (item === undefined) {
		throw new Error(`샘플 정의에 ${index}번 항목이 없습니다`);
	}
	return item;
}

function issuesOf(input: unknown): string[] {
	const result = parseFormDefinition(input);
	return result.ok ? [] : result.issues.map((issue) => issue.message);
}

describe(parseFormDefinition, () => {
	it("샘플 수련회 정의는 유효하다", () => {
		expect(parseFormDefinition(retreat2026Definition).ok).toBe(true);
	});

	it("필드 id 중복을 거부한다", () => {
		const input = clone();
		input.fields.push({ ...itemAt(input.fields, 0), id: "name" });
		expect(issuesOf(input).join(",")).toContain("필드 id 중복");
	});

	it("뒤쪽 필드를 참조하는 조건을 거부한다 (순환 방지)", () => {
		const input = clone();
		const name = input.fields.find((f) => f.id === "name");
		if (name) {
			name.showIf = { op: "answered", fieldId: "stay_type" };
		}
		expect(issuesOf(input).join(",")).toContain("앞쪽 필드만");
	});

	it("페이지에 배치되지 않은 필드를 거부한다", () => {
		const input = clone();
		input.pages[2] = {
			...itemAt(input.pages, 2),
			fieldIds: ["tf_team", "can_ride"],
		};
		expect(issuesOf(input).join(",")).toContain(
			"배치되지 않은 필드: ride_details",
		);
	});

	it("옵션별 금액이 빠지면 거부한다", () => {
		const input = clone();
		if (input.payment?.amount.kind === "byOption") {
			const { day: _removed, ...rest } = input.payment.amount.amounts;
			input.payment.amount.amounts = rest;
		}
		expect(issuesOf(input).join(",")).toContain("옵션 금액 누락: day");
	});

	it("조건부 필드를 identity로 쓰면 거부한다", () => {
		const input = clone();
		input.identity = { fieldId: "arrival_note" };
		expect(issuesOf(input).length).toBeGreaterThan(0);
	});

	it("예약어 필드 id를 거부한다", () => {
		const input = clone();
		input.fields.push({ id: "amount", type: "number", label: "금액" });
		input.pages[0]?.fieldIds.push("amount");
		expect(issuesOf(input).join(",")).toContain("예약어");
	});

	it("알림 템플릿이 있는데 contact가 없으면 거부한다", () => {
		const input = clone();
		input.contact = undefined;
		expect(issuesOf(input).join(",")).toContain("contact.phoneFieldId");
	});
});
