import type { Answers } from "@jwc/form-core/answers/value";
import type { FormDefinition } from "@jwc/form-core/definition/definition";
import { isReminderDue } from "@jwc/form-core/messaging";
import type { StoredSubmission } from "@jwc/submission-store";

import { notificationFor } from "./submission-plan";
import type { NotificationIntent } from "./submission-plan";

/**
 * 미입금 알림 대상 판단(순수 함수).
 * 입력: 저장소 레코드(납입 여부/답변의 원본) + 키(최초 제출 시각) + 발송 이력(message_log에서 파생).
 */

export interface ReminderInput {
	definition: FormDefinition;
	/** 응답 id → 발송 이력 */
	history: ReadonlyMap<
		string,
		{ sentCount: number; lastSentAt: number | null }
	>;
	/** 응답 id → 최초 제출 시각 (D1 키). 키가 없는 레코드는 대상에서 뺀다 */
	keys: ReadonlyMap<string, { createdAt: number }>;
	now: number;
	records: readonly StoredSubmission[];
}

interface ReminderDue {
	answers: Answers;
	intent: NotificationIntent;
}

export interface ReminderPlan {
	due: ReminderDue[];
	/** 저장소에는 있는데 D1 키가 없는 레코드 수 (운영자가 행을 복사한 경우 등) */
	unkeyed: number;
}

const NO_HISTORY = { sentCount: 0, lastSentAt: null } as const;

export function planReminders(input: ReminderInput): ReminderPlan {
	const rule = input.definition.payment?.reminder;
	if (!rule) {
		return { due: [], unkeyed: 0 };
	}
	const due: ReminderDue[] = [];
	let unkeyed = 0;
	for (const record of input.records) {
		const key = input.keys.get(record.id);
		if (!key) {
			unkeyed += 1;
			continue;
		}
		const history = input.history.get(record.id) ?? NO_HISTORY;
		const isDue = isReminderDue(
			{ submittedAt: key.createdAt, paid: record.paid, ...history },
			rule,
			input.now,
		);
		const intent = isDue
			? notificationFor(input.definition, record.answers, {
					kind: "onReminder",
					submissionId: record.id,
					idempotencyKey: `${record.id}:onReminder:${history.sentCount + 1}`,
				})
			: null;
		if (intent) {
			due.push({ answers: record.answers, intent });
		}
	}
	return { due, unkeyed };
}
