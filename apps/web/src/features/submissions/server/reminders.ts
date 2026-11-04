import { classifyError } from "../../../platform/server/errors/classify";
import { captureException, log } from "../../../platform/server/log";
import { submissionStore } from "../../../platform/server/runtime";
import {
	publishedFormById,
	storeTargetOf,
} from "../../forms/server/definitions";
import { listOpenForms } from "../../forms/server/forms-repository";
import type { FormRow } from "../../forms/server/forms-repository";
import { planReminders } from "../domain/reminder-plan";
import { enqueueNotification } from "./notify";
import { listStoredKeys, reminderHistory } from "./submission-keys-repository";

/**
 * 미입금 알림 배치 (cron, 해석기).
 * 납입 여부/답변은 저장소(원본)에서, 최초 제출 시각은 D1 키에서, 발송 이력은 message_log에서 읽고
 * 대상 판단은 domain/reminder-plan의 순수 함수가 한다. 저장소가 원본이라 D1을 "교정"할 일이 없다.
 */
export async function runPaymentReminders(
	now: number,
): Promise<{ queued: number }> {
	let queued = 0;
	for (const form of await listOpenForms()) {
		try {
			// oxlint-disable-next-line no-await-in-loop -- 폼마다 저장소를 읽고 문자를 큐에 넣는다. 크론 1회 실행 안에서 부하를 퍼뜨리려고 순차 처리한다
			queued += await remindForm(form, now);
		} catch (error) {
			const failure = classifyError(error);
			log[failure.spec.level]("reminder.form_failed", {
				formId: form.id,
				code: failure.code,
				error: failure.internalMessage,
			});
			captureException(failure, "cron.payment_reminders");
		}
	}
	log.info("reminder.completed", { queued });
	return { queued };
}

async function remindForm(form: FormRow, now: number): Promise<number> {
	const { definition } = await publishedFormById(form.id);
	if (!definition.payment?.reminder) {
		return 0;
	}
	const [records, keys] = await Promise.all([
		submissionStore().list(storeTargetOf(form, definition)),
		listStoredKeys(form.id),
	]);
	const unpaid = records.filter((record) => !record.paid);
	const plan = planReminders({
		definition,
		records: unpaid,
		keys: new Map(keys.map((key) => [key.id, key])),
		history: await reminderHistory(unpaid.map((record) => record.id)),
		now,
	});
	if (plan.unkeyed > 0) {
		log.warn("reminder.unkeyed_records", {
			formId: form.id,
			count: plan.unkeyed,
		});
	}
	let queued = 0;
	for (const due of plan.due) {
		// oxlint-disable-next-line no-await-in-loop -- 위와 같은 이유로 큐 전송을 순차 처리한다
		if (await enqueueNotification(definition, due.answers, due.intent)) {
			queued += 1;
		}
	}
	return queued;
}
