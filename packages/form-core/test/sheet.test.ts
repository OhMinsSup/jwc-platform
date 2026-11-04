import { describe, expect, it } from "vite-plus/test";

import {
	headerRow,
	interpretCellEdit,
	parseSheetRow,
	toSheetRow,
	validateAnswers,
} from "../src";
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

	it("셀 수정 해석: 납입여부/필드/읽기전용/잘못된 값", () => {
		expect(interpretCellEdit(definition, "납입여부", "납입")).toStrictEqual({
			kind: "paid",
			paid: true,
		});
		expect(interpretCellEdit(definition, "숙박형태", "무박")).toStrictEqual({
			kind: "field",
			fieldId: "stay_type",
			value: "day",
		});
		expect(interpretCellEdit(definition, "응답 ID", "x").kind).toBe("readonly");
		expect(interpretCellEdit(definition, "성별", "모름").kind).toBe("invalid");
		expect(interpretCellEdit(definition, "없는헤더", "x").kind).toBe("unknown");
	});
});
