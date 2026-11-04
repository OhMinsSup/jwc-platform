import { describe, expect, it } from "vite-plus/test";

import {
	REQUIRED_MESSAGE,
	validateAnswers,
	validatePage,
} from "../src/answers/validate";
import { resolveVisibility } from "../src/logic/visibility";
import { retreat, validRetreatAnswers } from "./fixtures";

describe(validateAnswers, () => {
	const definition = retreat();
	const withArrival = (arrival_at: string) =>
		validateAnswers(definition, { ...validRetreatAnswers, arrival_at });

	it("정상 답변을 통과시키고 전화번호를 정규화한다", () => {
		const result = validateAnswers(definition, validRetreatAnswers);
		expect(result.ok).toBe(true);
		expect(result.answers.phone).toBe("01012345678");
	});

	it("필수 항목 누락을 보고한다", () => {
		const result = validateAnswers(definition, {
			...validRetreatAnswers,
			name: "  ",
		});
		expect(result.ok).toBe(false);
		expect(!result.ok && result.errors.name).toBe(REQUIRED_MESSAGE);
	});

	it("목록에 없는 옵션 값을 거부한다", () => {
		const result = validateAnswers(definition, {
			...validRetreatAnswers,
			gender: "unknown",
		});
		expect(!result.ok && result.errors.gender).toBe("목록에서 선택해주세요");
	});

	it("전체 참석이면 참석일시 필드를 숨기고 답변도 버린다", () => {
		const result = validateAnswers(definition, {
			...validRetreatAnswers,
			stay_type: "full",
		});
		expect(result.ok).toBe(true);
		expect(result.answers.arrival_at).toBeUndefined();
		expect(result.answers.arrival_note).toBeUndefined();
	});

	it("부분 참석인데 참석일시가 없으면 필수 오류", () => {
		const { arrival_at: _, ...rest } = validRetreatAnswers;
		const result = validateAnswers(definition, rest);
		expect(!result.ok && result.errors.arrival_at).toBe(REQUIRED_MESSAGE);
	});

	it("datetime 범위를 경계값으로 검사한다", () => {
		expect(withArrival("2026-06-25T06:00").ok).toBe(true);
		expect(withArrival("2026-06-28T22:00").ok).toBe(true);
		expect(withArrival("2026-06-25T05:30").ok).toBe(false);
		expect(withArrival("2026-06-28T22:30").ok).toBe(false);
	});

	it("datetime 분 단위와 실존 날짜를 검사한다", () => {
		expect(withArrival("2026-06-26T14:15").ok).toBe(false);
		expect(withArrival("2026-02-30T10:00").ok).toBe(false);
	});

	it("휴대전화가 아닌 번호를 거부한다", () => {
		expect(
			validateAnswers(definition, {
				...validRetreatAnswers,
				phone: "02-123-4567",
			}).ok,
		).toBe(false);
		expect(
			validateAnswers(definition, {
				...validRetreatAnswers,
				phone: "+82 10-1234-5678",
			}).ok,
		).toBe(true);
	});

	it("정의에 없는 키는 결과에서 제거한다", () => {
		const result = validateAnswers(definition, {
			...validRetreatAnswers,
			injected: "x",
		});
		expect(result.answers).not.toHaveProperty("injected");
	});

	it("페이지 단위 검증은 해당 페이지 필드만 본다", () => {
		const result = validatePage(definition, { name: "홍길동" }, "personal");
		expect(result.ok).toBe(false);
		expect(Object.keys(result.ok ? {} : result.errors)).toStrictEqual([
			"phone",
			"gender",
			"department",
			"age_group",
		]);
	});

	it("숨김이 연쇄된다: 차량 불가 → 상세 숨김", () => {
		const state = resolveVisibility(definition, {
			...validRetreatAnswers,
			can_ride: false,
			ride_details: "x",
		});
		expect(state.fieldIds).not.toContain("ride_details");
	});
});
