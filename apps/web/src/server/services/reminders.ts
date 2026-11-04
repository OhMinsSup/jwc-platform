import { isReminderDue } from "@jwc/form-core";

import { errorMessage, log } from "../log";
import { listOpenForms } from "../repositories/forms";
import { listUnpaid, setPaid } from "../repositories/submissions";
import { sheets } from "../runtime";
import { publishedFormById } from "./definitions";
import { enqueueNotification } from "./notify";
import { readAllRecords } from "./sheet-store";

/**
 * 미입금 알림 배치 (cron).
 * 발송 대상 판정은 D1(납입/알림 이력), 메시지 내용은 시트(답변 원본)에서 가져온다.
 * 시트에서 이미 "납입"으로 바뀌었는데 웹훅이 누락된 경우 D1을 교정한다.
 */
export async function runPaymentReminders(
	now: number,
): Promise<{ queued: number; healed: number }> {
	let queued = 0;
	let healed = 0;
	for (const form of await listOpenForms()) {
		try {
			// oxlint-disable-next-line no-await-in-loop -- 폼마다 시트를 읽고 문자를 큐에 넣는다. 크론 1회 실행 안에서 부하를 퍼뜨리려고 순차 처리한다
			const result = await remindForm(form.id, form.sheetName, now);
			queued += result.queued;
			healed += result.healed;
		} catch (error) {
			log.error("reminder.form_failed", {
				formId: form.id,
				error: errorMessage(error),
			});
		}
	}
	log.info("reminder.completed", { queued, healed });
	return { queued, healed };
}

async function remindForm(formId: string, sheetName: string, now: number) {
	const { definition } = await publishedFormById(formId);
	const rule = definition.payment?.reminder;
	if (!rule) {
		return { queued: 0, healed: 0 };
	}
	const unpaid = await listUnpaid(formId);
	const due = unpaid.filter((s) =>
		isReminderDue(
			{
				submittedAt: s.submittedAt,
				paid: s.paid,
				sentCount: s.reminderCount,
				lastSentAt: s.reminderLastAt,
			},
			rule,
			now,
		),
	);
	if (due.length === 0) {
		return { queued: 0, healed: 0 };
	}
	const records = await readAllRecords(sheets(), sheetName, definition);
	let queued = 0;
	let healed = 0;
	for (const submission of due) {
		const record = records.get(submission.id);
		if (!record) {
			log.warn("reminder.row_missing", { submissionId: submission.id });
			continue;
		}
		if (record.paid) {
			// oxlint-disable-next-line no-await-in-loop -- 시트에서 납입 확인된 행만 소수 보정한다. D1 쓰기 경합을 피하려 순차 처리
			await setPaid(submission.id, true, now);
			healed += 1;
			continue;
		}
		const key = `${submission.id}:onReminder:${submission.reminderCount + 1}`;
		// oxlint-disable-next-line no-await-in-loop -- 위 runPaymentReminders와 같이 크론 1회 실행 안에서 큐 전송 부하를 퍼뜨리려고 순차 처리한다
		const enqueued = await enqueueNotification(
			definition,
			submission,
			record.answers,
			"onReminder",
			key,
		);
		if (enqueued) {
			queued += 1;
		}
	}
	return { queued, healed };
}
