import { describe, expect, it } from "vite-plus/test";

import { validateAnswers } from "../src/answers/validate";
import { headerRow } from "../src/sheet/columns";
import { parseSheetRow, toSheetRow } from "../src/sheet/rows";
import { retreat, validRetreatAnswers } from "./fixtures";

// 2026-05-01 12:00:00 KST
const SUBMITTED = Date.UTC(2026, 4, 1, 3, 0, 0);

describe("시트 코덱", () => {
	const definition = retreat();
	const validation = validateAnswers(definition, validRetreatAnswers);
	const record = {
		id: "sub_1",
		submittedAt: SUBMITTED,
		updatedAt: SUBMITTED,
		paid: false,
		answers: validation.answers,
	};

	it("헤더는 시스템 컬럼 + 표시 순서의 필드 헤더", () => {
		expect(headerRow(definition).slice(0, 6)).toStrictEqual([
			"응답 ID",
			"제출일시",
			"수정일시",
			"납입여부",
			"이름",
			"연락처",
		]);
	});

	it("레코드 → 행: 라벨/포맷/KST 시간으로 인코딩", () => {
		const row = toSheetRow(definition, headerRow(definition), record);
		expect(row.slice(0, 7)).toStrictEqual([
			"sub_1",
			"2026-05-01 12:00:00",
			"2026-05-01 12:00:00",
			"미납",
			"홍길동",
			"010-1234-5678",
			"남성",
		]);
		expect(row).toContain("2026-06-26 14:30");
		expect(row).toContain("1박2일");
	});

	it("행 → 레코드 왕복 시 답변이 보존된다", () => {
		const headers = headerRow(definition);
		const row = toSheetRow(definition, headers, record).map(
			(cell) => cell ?? "",
		);
		const parsed = parseSheetRow(definition, headers, row);
		expect(parsed.errors).toStrictEqual({});
		expect(parsed.answers).toStrictEqual(validation.answers);
	});

	it("운영자가 컬럼 순서를 바꾸고 모르는 컬럼을 추가해도 안전하다", () => {
		const headers = ["메모", ...headerRow(definition).toReversed()];
		const row = toSheetRow(definition, headers, record);
		expect(row[0]).toBeNull();
		expect(row.at(-1)).toBe("sub_1");
	});

	it("paid가 없으면 납입여부 칸을 비워(null) 기존 값을 보존한다", () => {
		const headers = headerRow(definition);
		const withoutPaid = { ...record, paid: undefined };
		const row = toSheetRow(definition, headers, withoutPaid);
		expect(row[headers.indexOf("납입여부")]).toBeNull();
		expect(row[headers.indexOf("응답 ID")]).toBe("sub_1");
	});
});
