import { parseFormDefinition } from "@jwc/form-core/definition/definition";
import type {
	FormDefinition,
	FormDefinitionInput,
} from "@jwc/form-core/definition/definition";
import { retreat2026Definition } from "@jwc/form-core/samples/retreat-2026";
import { describe, expect, it } from "vite-plus/test";

import {
	admitSubmission,
	composeSms,
	planSubmissionWrite,
} from "../src/features/submissions/domain/submission-plan";

/** 2026-05-01 12:00 KST (마감 2026-06-14 23:59 KST 전) */
const OPEN_AT = Date.UTC(2026, 4, 1, 3, 0, 0);
/** 2026-06-15 00:30 KST (마감 후) */
const AFTER_CLOSE = Date.UTC(2026, 5, 14, 15, 30, 0);

function definition(
	overrides: Partial<FormDefinitionInput> = {},
): FormDefinition {
	const parsed = parseFormDefinition({
		...retreat2026Definition,
		...overrides,
	});
	if (!parsed.ok) {
		throw new Error(JSON.stringify(parsed.issues));
	}
	return parsed.definition;
}

const RAW = {
	name: "홍길동",
	phone: "010-1234-5678",
	gender: "male",
	department: "youth1",
	age_group: "y95",
	stay_type: "full",
	tf_team: "none",
	can_ride: false,
};

function admitted() {
	const admission = admitSubmission(definition(), "open", RAW, OPEN_AT);
	if (!admission.ok) {
		throw new Error(admission.reason);
	}
	return admission;
}

describe(admitSubmission, () => {
	it("접수 중이면 검증된 답변과 정규화된 식별값을 돌려준다", () => {
		const admission = admitted();
		expect(admission.identity).toBe("01012345678");
		expect(admission.answers.name).toBe("홍길동");
	});

	it("open이 아니거나 마감 시각이 지나면 closed", () => {
		expect(admitSubmission(definition(), "closed", RAW, OPEN_AT)).toStrictEqual(
			{
				ok: false,
				reason: "closed",
			},
		);
		expect(
			admitSubmission(definition(), "open", RAW, AFTER_CLOSE),
		).toStrictEqual({ ok: false, reason: "closed" });
	});

	it("검증 실패는 필드 오류를 데이터로 돌려준다", () => {
		const admission = admitSubmission(
			definition(),
			"open",
			{ ...RAW, phone: "123" },
			OPEN_AT,
		);
		expect(admission.ok).toBe(false);
		expect(admission.ok ? null : admission.reason).toBe("invalid");
		expect(
			admission.ok || admission.reason !== "invalid"
				? {}
				: admission.fieldErrors,
		).toHaveProperty("phone");
	});
});

describe(planSubmissionWrite, () => {
	const key = { id: "sub_1", revision: 1, createdAt: OPEN_AT, storedAt: null };

	it("처음 저장하는 키는 신규: 미납으로 시작하고 onCreate 알림", () => {
		const plan = planSubmissionWrite(definition(), key, admitted().answers);
		expect(plan.isNew).toBe(true);
		expect(plan.record.paid).toBe(false);
		expect(plan.record.submittedAt).toBe(OPEN_AT);
		expect(plan.notification).toStrictEqual({
			kind: "onCreate",
			submissionId: "sub_1",
			idempotencyKey: "sub_1:onCreate:1",
		});
	});

	it("재제출은 납입 여부를 쓰지 않고(보존) onUpdate, revision이 멱등 키에 들어간다", () => {
		const plan = planSubmissionWrite(
			definition(),
			{ ...key, revision: 3, storedAt: OPEN_AT },
			admitted().answers,
		);
		expect(plan.isNew).toBe(false);
		expect(plan.record.paid).toBeUndefined();
		expect(plan.record.submittedAt).toBe(OPEN_AT);
		expect(plan.notification?.idempotencyKey).toBe("sub_1:onUpdate:3");
	});

	it("템플릿이 없으면 알림이 없다", () => {
		const plan = planSubmissionWrite(
			definition({ notifications: {} }),
			key,
			admitted().answers,
		);
		expect(plan.notification).toBeNull();
	});
});

describe(composeSms, () => {
	it("연락처와 템플릿 변수로 본문을 만든다", () => {
		const sms = composeSms(
			definition(),
			admitted().answers,
			{ kind: "onCreate", submissionId: "sub_1", idempotencyKey: "k" },
			"https://example.test/r/sub_1",
		);
		expect(sms?.to).toBe("01012345678");
		expect(sms?.text).toContain("홍길동님");
		expect(sms?.text).toContain("65,000");
		expect(sms?.text).toContain("https://example.test/r/sub_1");
	});
});
