import type { CloudEnv, QueueBatch } from "void";

import paymentReminders, {
	cron as paymentReminderCron,
} from "../../crons/payment-reminders";
import sheetsConsumer from "../../queues/sheets";
import smsConsumer from "../../queues/sms";
import { log } from "./log";
import { QUEUES } from "./queue-config";

/** void가 cron/queue 핸들러에 넘기는 바인딩 */
type Bindings = CloudEnv["Bindings"];

/** defineScheduled 핸들러 형태 */
type ScheduledHandler = (
	controller: ScheduledController,
	env: Bindings,
	ctx: ExecutionContext,
) => unknown;

/**
 * 큐 이름으로 고르는 소비자 표. 메시지 본문 타입은 큐마다 다르므로 표에서는 never로 둔다
 * (본문은 읽기 전용이라 어떤 defineQueue<T> 소비자도 이 형태에 대입된다).
 */
type QueueHandler = (
	batch: QueueBatch<never>,
	env: Bindings,
	ctx: ExecutionContext,
) => void | Promise<void>;

/** cron 표현식 → 작업 */
const CRON_JOBS: { cron: string; run: ScheduledHandler }[] = [
	{ cron: paymentReminderCron, run: paymentReminders },
];

/** Cloudflare 큐 이름 → 소비자 */
const QUEUE_CONSUMERS: Record<string, QueueHandler> = {
	[QUEUES.sheets.name]: sheetsConsumer,
	[QUEUES.sms.name]: smsConsumer,
};

export async function dispatchScheduled(
	controller: ScheduledController,
	env: Bindings,
	ctx: ExecutionContext,
): Promise<void> {
	const jobs = CRON_JOBS.filter((job) => job.cron === controller.cron);
	if (jobs.length === 0) {
		log.warn("scheduled.unknown_cron", { cron: controller.cron });
		return;
	}
	await Promise.all(jobs.map((job) => job.run(controller, env, ctx)));
}

export async function dispatchQueue(
	batch: QueueBatch<never>,
	env: Bindings,
	ctx: ExecutionContext,
): Promise<void> {
	const consumer = QUEUE_CONSUMERS[batch.queue];
	if (!consumer) {
		// 처리할 수 없는 큐: 재시도해도 의미 없으므로 로그만 남기고 소진시키지 않는다
		log.error("queue.unknown", {
			queue: batch.queue,
			size: batch.messages.length,
		});
		batch.retryAll({ delaySeconds: 300 });
		return;
	}
	await consumer(batch, env, ctx);
}
