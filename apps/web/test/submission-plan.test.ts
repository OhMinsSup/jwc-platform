import { parseFormDefinition } from "@jwc/form-core/definition/definition";
import type {
	FormDefinition,
	FormDefinitionInput,
} from "@jwc/form-core/definition/definition";
import { retreat2026Definition } from "@jwc/form-core/samples/retreat-2026";
import type { StoredSubmission } from "@jwc/submission-store";
import { describe, expect, it } from "vite-plus/test";

import { planReminders } from "../src/features/submissions/domain/reminder-plan";
import {
	admitSubmission,
	composeSms,
	planSubmissionWrite,
} from "../src/features/submissions/domain/submission-plan";

const DAY_MS = 86_400_000;
/** 2026-05-01 12:00 KST (마감 2026-06-14 23:59 KST 전) */
const OPEN_AT = Date.UTC(2026, 4, 1, 3, 0, 0);
/** 미입금 알림 규칙과 그 템플릿을 함께 뺀 정의 (무결성 규칙상 둘은 같이 있어야 한다) */
function withoutReminders(
	notifications: FormDefinitionInput["notifications"],
): FormDefinition {
	const { payment } = retreat2026Definition;
	return definition({
		notifications,
		payment: payment && { account: payment.account, amount: payment.amount },
	});
}

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
		const plan = planSubmissionWrite(
			definition(),
			key,
			admitted().answers,
			OPEN_AT,
		);
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
		const later = OPEN_AT + DAY_MS;
		const plan = planSubmissionWrite(
			definition(),
			{ ...key, revision: 3, storedAt: OPEN_AT },
			admitted().answers,
			later,
		);
		expect(plan.isNew).toBe(false);
		expect(plan.record.paid).toBeUndefined();
		expect(plan.record.submittedAt).toBe(OPEN_AT);
		expect(plan.record.updatedAt).toBe(later);
		expect(plan.notification?.idempotencyKey).toBe("sub_1:onUpdate:3");
	});

	it("템플릿이 없으면 알림이 없다", () => {
		const plan = planSubmissionWrite(
			withoutReminders({}),
			key,
			admitted().answers,
			OPEN_AT,
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

function storedRecord(id: string, paid = false): StoredSubmission {
	return { id, paid, answers: admitted().answers, issues: {} };
}

describe(planReminders, () => {
	const record = storedRecord;
	const keys = new Map([
		["a", { createdAt: OPEN_AT }],
		["b", { createdAt: OPEN_AT }],
	]);

	it("첫 알림은 제출 후 firstAfterDays가 지나면, 멱등 키는 발송 횟수+1", () => {
		const plan = planReminders({
			definition: definition(),
			records: [record("a")],
			keys,
			history: new Map(),
			now: OPEN_AT + 7 * DAY_MS,
		});
		expect(plan.due.map((due) => due.intent.idempotencyKey)).toStrictEqual([
			"a:onReminder:1",
		]);
	});

	it("납입했거나, 간격 전이거나, 최대 횟수면 대상이 아니다", () => {
		const now = OPEN_AT + 30 * DAY_MS;
		const plan = planReminders({
			definition: definition(),
			records: [record("a", true), record("b")],
			keys,
			history: new Map([["b", { sentCount: 3, lastSentAt: OPEN_AT }]]),
			now,
		});
		expect(plan.due).toStrictEqual([]);
		const early = planReminders({
			definition: definition(),
			records: [record("b")],
			keys,
			history: new Map([["b", { sentCount: 1, lastSentAt: now - DAY_MS }]]),
			now,
		});
		expect(early.due).toStrictEqual([]);
	});

	it("D1 키가 없는 레코드는 건너뛰고 수를 센다", () => {
		const plan = planReminders({
			definition: definition(),
			records: [record("x")],
			keys,
			history: new Map(),
			now: OPEN_AT + 30 * DAY_MS,
		});
		expect(plan).toStrictEqual({ due: [], unkeyed: 1 });
	});

	it("알림 규칙이 없으면 아무것도 하지 않는다", () => {
		const { onCreate, onUpdate } = retreat2026Definition.notifications ?? {};
		const plan = planReminders({
			definition: withoutReminders({ onCreate, onUpdate }),
			records: [record("a")],
			keys,
			history: new Map(),
			now: OPEN_AT + 30 * DAY_MS,
		});
		expect(plan).toStrictEqual({ due: [], unkeyed: 0 });
	});
});
