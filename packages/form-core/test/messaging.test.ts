import { describe, expect, it } from "vite-plus/test";

import {
	computeAmount,
	formatInTimeZone,
	isReminderDue,
	messageVariables,
	renderTemplate,
	templateFor,
} from "../src";
import { retreat, validRetreatAnswers } from "./fixtures";

const DAY = 86_400_000;
const RULE = { firstAfterDays: 7, intervalDays: 7, maxCount: 3 };

describe("메시지", () => {
	const definition = retreat();

	it("옵션별 금액을 계산한다", () => {
		expect(computeAmount(definition, { stay_type: "full" })).toBe(65_000);
		expect(computeAmount(definition, {})).toBeNull();
	});

	it("템플릿에 필드 라벨과 내장 변수를 채운다", () => {
		const variables = messageVariables(definition, validRetreatAnswers, {
			submissionId: "s1",
			link: "https://x/r/s1",
		});
		const text = renderTemplate(
			templateFor(definition, "onCreate") ?? "",
			variables,
		);
		expect(text).toContain("홍길동님, 수련회 신청완료");
		expect(text).toContain("금액: 45,000원 (1박2일)");
		expect(text).toContain("https://x/r/s1");
	});

	it("알 수 없는 변수는 빈 문자열", () => {
		expect(renderTemplate("a{{nope}}b", {})).toBe("ab");
	});
});

describe(isReminderDue, () => {
	const base = { submittedAt: 0, paid: false, sentCount: 0, lastSentAt: null };

	it("첫 알림은 제출 후 firstAfterDays 경과 시점부터", () => {
		expect(isReminderDue(base, RULE, 7 * DAY - 1)).toBe(false);
		expect(isReminderDue(base, RULE, 7 * DAY)).toBe(true);
	});

	it("이후는 간격 기준, 최대 횟수/납입 시 중단", () => {
		expect(
			isReminderDue(
				{ ...base, sentCount: 1, lastSentAt: 10 * DAY },
				RULE,
				16 * DAY,
			),
		).toBe(false);
		expect(
			isReminderDue(
				{ ...base, sentCount: 1, lastSentAt: 10 * DAY },
				RULE,
				17 * DAY,
			),
		).toBe(true);
		expect(
			isReminderDue({ ...base, sentCount: 3, lastSentAt: 0 }, RULE, 100 * DAY),
		).toBe(false);
		expect(isReminderDue({ ...base, paid: true }, RULE, 100 * DAY)).toBe(false);
	});
});

describe(formatInTimeZone, () => {
	it("KST로 변환한다 (자정 경계)", () => {
		expect(
			formatInTimeZone(Date.UTC(2026, 5, 24, 15, 0, 0), "Asia/Seoul"),
		).toBe("2026-06-25 00:00:00");
	});

	it("DST가 있는 타임존도 Intl이 처리한다", () => {
		expect(
			formatInTimeZone(Date.UTC(2026, 2, 8, 7, 30, 0), "America/New_York"),
		).toBe("2026-03-08 03:30:00");
		expect(
			formatInTimeZone(Date.UTC(2026, 2, 8, 6, 30, 0), "America/New_York"),
		).toBe("2026-03-08 01:30:00");
	});
});
