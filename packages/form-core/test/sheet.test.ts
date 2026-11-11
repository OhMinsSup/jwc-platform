import { describe, expect, it } from "vite-plus/test";

import { validateAnswers } from "../src/answers/validate";
import {
	parseFormDefinition,
	parseStoredFormDefinition,
} from "../src/definition/definition";
import { FieldSchema } from "../src/definition/fields";
import { partHeader } from "../src/field-types/values";
import { CELL_CODECS, submittedAtText } from "../src/sheet/cells";
import {
	headerRow,
	missingHeaders,
	systemColumnIndex,
} from "../src/sheet/columns";
import { parseSheetRow, toSheetRow } from "../src/sheet/rows";
import { retreat, validRetreatAnswers } from "./fixtures";

// 2026-05-01 12:00:00 KST (금)
const SUBMITTED = Date.UTC(2026, 4, 1, 3, 0, 0);
// 2026-06-26 14:30 → 날짜 46199, 시간 14.5/24
const ARRIVAL_DATE_SERIAL = 46_199;
const ARRIVAL_TIME_SERIAL = 14.5 / 24;

describe("시트 코덱", () => {
	const definition = retreat();
	const validation = validateAnswers(definition, validRetreatAnswers);
	const record = {
		id: "sub_1",
		submittedAt: SUBMITTED,
		paid: false,
		answers: validation.answers,
	};

	it("헤더는 ID·신청일시, 표시 순서의 질문, 납입여부 순", () => {
		const headers = headerRow(definition);
		expect(headers.slice(0, 4)).toStrictEqual([
			"ID",
			"신청일시",
			"이름",
			"연락처",
		]);
		expect(headers.at(-1)).toBe("납입여부");
	});

	it("결제가 없는 폼은 납입여부 컬럼이 없다", () => {
		const parsed = parseFormDefinition({ ...definition, payment: undefined });
		if (!parsed.ok) {
			throw new Error("fixture invalid");
		}
		expect(headerRow(parsed.definition)).not.toContain("납입여부");
	});

	it("레코드 → 행: 라벨, 신청일시 텍스트, 날짜는 일련번호", () => {
		const headers = headerRow(definition);
		const row = toSheetRow(definition, headers, record);
		expect(row.slice(0, 5)).toStrictEqual([
			"sub_1",
			"2026년 05월 01일 (금) 12:00",
			"홍길동",
			"010-1234-5678",
			"남성",
		]);
		expect(row[headers.indexOf("참석일자")]).toBe(ARRIVAL_DATE_SERIAL);
		expect(row[headers.indexOf("참석시간")]).toBeCloseTo(
			ARRIVAL_TIME_SERIAL,
			9,
		);
		expect(row).toContain("1박2일");
		expect(row.at(-1)).toBe("미납");
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

	it("일시 질문은 날짜 열 + 시간 열이고, 통짜 '참석일시' 열은 새 탭에 만들지 않는다", () => {
		const headers = headerRow(definition);
		expect(headers).toContain("참석일자");
		expect(headers).toContain("참석시간");
		expect(headers).not.toContain("참석일시");
	});

	it("운영자가 시트에서 날짜·시간을 각각 고친 값을 합쳐 읽는다", () => {
		const headers = headerRow(definition);
		const row = toSheetRow(definition, headers, record).map(
			(cell) => cell ?? "",
		);
		row[headers.indexOf("참석일자")] = 46_200;
		row[headers.indexOf("참석시간")] = 9 / 24;
		const parsed = parseSheetRow(definition, headers, row);
		expect(parsed.answers.arrival_at).toBe("2026-06-27T09:00");
	});

	it("날짜나 시간 한쪽만 있으면 그 질문의 오류로 알린다", () => {
		const headers = headerRow(definition);
		const row = toSheetRow(definition, headers, record).map(
			(cell) => cell ?? "",
		);
		row[headers.indexOf("참석시간")] = "";
		const parsed = parseSheetRow(definition, headers, row);
		expect(parsed.answers.arrival_at).toBeUndefined();
		expect(parsed.errors["참석일시"]).toBe("날짜와 시간을 모두 입력해주세요");
	});

	describe("이전 버전의 통짜 '참석일시' 열이 있는 탭", () => {
		const legacyHeaders = headerRow(definition)
			.map((header) => (header === "참석일자" ? "참석일시" : header))
			.filter((header) => header !== "참석시간");

		it("통짜 열만 있으면 그 열을 읽고(글자도), 날짜·시간 열을 빠진 열로 센다", () => {
			const row = toSheetRow(definition, legacyHeaders, record).map(
				(cell) => cell ?? "",
			);
			row[legacyHeaders.indexOf("참석일시")] = "2026-06-26 14:30";
			const parsed = parseSheetRow(definition, legacyHeaders, row);
			expect(parsed.answers.arrival_at).toBe("2026-06-26T14:30");
			expect(missingHeaders(definition, legacyHeaders)).toStrictEqual([
				"참석일자",
				"참석시간",
			]);
		});

		it("나눈 열이 더해진 뒤에는 통짜 열도 함께 갱신하고, 읽을 때는 나눈 열이 우선한다", () => {
			const headers = [...legacyHeaders, "참석일자", "참석시간"];
			const row = toSheetRow(definition, headers, record);
			expect(row[headers.indexOf("참석일시")]).toBeCloseTo(
				ARRIVAL_DATE_SERIAL + ARRIVAL_TIME_SERIAL,
				9,
			);
			const cells = row.map((cell) => cell ?? "");
			cells[headers.indexOf("참석일시")] = "2026-06-25 10:00";
			const parsed = parseSheetRow(definition, headers, cells);
			expect(parsed.answers.arrival_at).toBe("2026-06-26T14:30");
		});
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
		expect(row[headers.indexOf("ID")]).toBe("sub_1");
	});

	describe("이전 버전 시트 (응답 ID·제출일시·수정일시)", () => {
		const legacy = [
			"응답 ID",
			"제출일시",
			"수정일시",
			"납입여부",
			...headerRow(definition).slice(2, -1),
		];

		it("이전 헤더를 같은 컬럼으로 보고 빠진 컬럼으로 세지 않는다", () => {
			expect(missingHeaders(definition, legacy)).toStrictEqual([]);
			expect(systemColumnIndex(legacy, "id")).toBe(0);
		});

		it("이전 헤더 칸에 쓰고, 관리하지 않는 수정일시 칸은 보존한다", () => {
			const row = toSheetRow(definition, legacy, record);
			expect(row.slice(0, 4)).toStrictEqual([
				"sub_1",
				"2026년 05월 01일 (금) 12:00",
				null,
				"미납",
			]);
			const parsed = parseSheetRow(
				definition,
				legacy,
				row.map((cell) => cell ?? ""),
			);
			expect(parsed.id).toBe("sub_1");
			expect(parsed.answers).toStrictEqual(validation.answers);
		});
	});
});

describe("셀 값 종류별 변환 (CELL_CODECS)", () => {
	const dateField = FieldSchema.parse({ id: "d", type: "date", label: "날짜" });
	const timeField = FieldSchema.parse({ id: "t", type: "time", label: "시간" });
	const numberField = FieldSchema.parse({
		id: "n",
		type: "number",
		label: "인원",
	});

	it("날짜·시간 왕복 (참고 시트 값: 46199 = 2026-06-26, 22/24 = 22:00)", () => {
		expect(CELL_CODECS.date.write(dateField, "2026-06-26")).toBe(46_199);
		expect(CELL_CODECS.date.read(dateField, 46_199)).toStrictEqual({
			ok: true,
			value: "2026-06-26",
		});
		expect(CELL_CODECS.time.read(timeField, 22 / 24)).toStrictEqual({
			ok: true,
			value: "22:00",
		});
		expect(CELL_CODECS.time.write(timeField, "00:00")).toBe(0);
	});

	it("부동소수 오차는 가까운 분으로 반올림한다", () => {
		expect(CELL_CODECS.time.read(timeField, 1 - 1e-7)).toStrictEqual({
			ok: true,
			value: "00:00",
		});
		expect(CELL_CODECS.time.read(timeField, 10.5 / 24 - 1e-12)).toStrictEqual({
			ok: true,
			value: "10:30",
		});
	});

	it("숫자 칸은 숫자로 쓰고, 쉼표가 든 글자도 읽는다", () => {
		expect(CELL_CODECS.number.write(numberField, 1200)).toBe(1200);
		expect(CELL_CODECS.number.read(numberField, "1,200")).toStrictEqual({
			ok: true,
			value: 1200,
		});
	});
});

describe(submittedAtText, () => {
	it("해당 타임존의 요일과 24시간제 시각", () => {
		// 2026-06-01 20:45 KST (월)
		expect(submittedAtText(Date.UTC(2026, 5, 1, 11, 45), "Asia/Seoul")).toBe(
			"2026년 06월 01일 (월) 20:45",
		);
	});

	it("DST 경계에서도 현지 시각", () => {
		// 2026-03-08 03:30 EDT (일) — 미국 서머타임 시작 직후
		expect(
			submittedAtText(Date.UTC(2026, 2, 8, 7, 30), "America/New_York"),
		).toBe("2026년 03월 08일 (일) 03:30");
	});
});

describe("나중에 예약한 운영 헤더와 겹치는 옛 정의 (회귀)", () => {
	const legacy = {
		...retreat(),
		fields: retreat().fields.map((field) =>
			field.id === "name" ? { ...field, columnHeader: "신청일시" } : field,
		),
	};

	it("새로 발행할 때는 막지만, 이미 발행된 정의는 그대로 연다", () => {
		expect(parseFormDefinition(legacy).ok).toBe(false);
		expect(parseStoredFormDefinition(legacy).ok).toBe(true);
	});

	it("이전부터 예약된 이름은 저장된 정의에서도 막는다", () => {
		const paidClash = {
			...retreat(),
			fields: retreat().fields.map((field) =>
				field.id === "name" ? { ...field, columnHeader: "납입여부" } : field,
			),
		};
		expect(parseStoredFormDefinition(paidClash).ok).toBe(false);
	});

	it("시트에서는 운영 컬럼이 이기고 겹친 질문은 열이 없다", () => {
		const parsed = parseStoredFormDefinition(legacy);
		if (!parsed.ok) {
			throw new Error("stored definition should parse");
		}
		const headers = headerRow(parsed.definition);
		expect(headers.filter((header) => header === "신청일시")).toHaveLength(1);
		expect(headers[1]).toBe("신청일시");
	});
});

describe(partHeader, () => {
	it("'…일시'는 '…일자'/'…시간'으로, 그 밖에는 뒤에 붙인다", () => {
		expect(partHeader("참석일시", "date")).toBe("참석일자");
		expect(partHeader("참석일시", "time")).toBe("참석시간");
		expect(partHeader("출발", "date")).toBe("출발 날짜");
		expect(partHeader("출발", "time")).toBe("출발 시간");
	});
});

describe("나눈 열 이름의 겹침", () => {
	const clashing = {
		...retreat(),
		fields: retreat().fields.map((field) =>
			field.id === "arrival_note"
				? { ...field, columnHeader: "참석시간" }
				: field,
		),
	};

	it("새로 편집·발행할 때는 다른 질문 헤더와 겹치는 나눈 열 이름을 막는다", () => {
		const parsed = parseFormDefinition(clashing);
		expect(parsed.ok).toBe(false);
		expect(
			parsed.ok ? [] : parsed.issues.map((issue) => issue.message),
		).toContain("시트 헤더 중복: 참석시간");
	});

	it("이미 발행된 옛 정의는 열고, 시트에서는 앞선 열이 이긴다", () => {
		const parsed = parseStoredFormDefinition(clashing);
		if (!parsed.ok) {
			throw new Error("stored definition should parse");
		}
		const headers = headerRow(parsed.definition);
		expect(headers.filter((header) => header === "참석시간")).toHaveLength(1);
	});
});
