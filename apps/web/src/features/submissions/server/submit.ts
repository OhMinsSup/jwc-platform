import { setTimeout as wait } from "node:timers/promises";

import { hmacHex } from "@jwc/common/crypto";
import { randomId } from "@jwc/common/encoding";

import { classifyError } from "../../../platform/server/errors/classify";
import { ConflictError } from "../../../platform/server/errors/conflict-error";
import { FormClosedError } from "../../../platform/server/errors/form-closed-error";
import { InvalidInputError } from "../../../platform/server/errors/invalid-input-error";
import { captureException, log } from "../../../platform/server/log";
import { dataKeys } from "../../../platform/server/runtime";
import { publishedFormBySlug } from "../../forms/server/definitions";
import { responseStore } from "../../forms/server/response-store";
import {
	admitSubmission,
	planSubmissionWrite,
} from "../domain/submission-plan";
import type { Admission } from "../domain/submission-plan";
import { enqueueNotification } from "./notify";
import {
	acquireWriteLock,
	claimKey,
	markStored,
	releaseWriteLock,
} from "./submission-keys-repository";

export interface SubmitResult {
	isNew: boolean;
	submissionId: string;
}

/** 같은 응답 동시 쓰기를 막는 임대 락. 저장소 쓰기(재시도 포함)보다 길게 잡는다 */
const WRITE_LOCK_TTL_MS = 30_000;
/** 같은 응답을 다른 요청이 쓰는 중일 때 기다리는 횟수/간격 (더블 클릭, 재전송 대비) */
const LOCK_ATTEMPTS = 4;
const LOCK_WAIT_MS = 500;

function rejectionOf(admission: Exclude<Admission, { ok: true }>): Error {
	switch (admission.reason) {
		case "closed": {
			return new FormClosedError();
		}
		case "invalid": {
			return new InvalidInputError(
				"입력값을 확인해주세요",
				admission.fieldErrors,
			);
		}
		case "missing_identity": {
			return new InvalidInputError("식별 항목이 비어 있습니다");
		}
		default: {
			return new InvalidInputError("제출할 수 없습니다");
		}
	}
}

async function lockForWrite(id: string): Promise<void> {
	for (let attempt = 1; attempt <= LOCK_ATTEMPTS; attempt += 1) {
		// oxlint-disable-next-line no-await-in-loop -- 락은 차례로 다시 시도해야 의미가 있다 (병렬 시도는 같은 결과)
		if (await acquireWriteLock(id, Date.now(), WRITE_LOCK_TTL_MS)) {
			return;
		}
		if (attempt < LOCK_ATTEMPTS) {
			// oxlint-disable-next-line no-await-in-loop -- 위와 같은 이유로 순차 대기
			await wait(LOCK_WAIT_MS);
		}
	}
	throw new ConflictError(
		"같은 신청을 처리하고 있습니다. 잠시 후 다시 시도해주세요",
	);
}

/**
 * 제출 처리 (해석기): 판단은 domain/submission-plan의 순수 함수가 하고, 여기서는 그 결과를 실행한다.
 * 검증 → D1 키 claim(유니크) → 쓰기 락 → 저장소 저장(주 DB) → 저장 완료 기록 → 알림 큐.
 * 저장소에 저장된 뒤에만 "접수됨"을 돌려준다.
 */
export async function submitAnswers(
	slug: string,
	raw: Record<string, unknown>,
	now: number,
): Promise<SubmitResult> {
	const { form, definition, sheet } = await publishedFormBySlug(slug);
	const admission = admitSubmission(definition, form.status, raw, now);
	if (!admission.ok) {
		throw rejectionOf(admission);
	}
	const keys = await dataKeys();
	const key = await claimKey({
		id: randomId(),
		formId: form.id,
		identityHash: await hmacHex(
			keys.identity,
			`${form.id}:${admission.identity}`,
		),
		now,
	});
	await lockForWrite(key.id);
	const plan = planSubmissionWrite(definition, key, admission.answers);
	try {
		await responseStore(sheet, definition).put(plan.record);
		await markStored(key.id, now);
	} catch (error) {
		await releaseWriteLock(key.id);
		throw error;
	}
	if (plan.notification) {
		await notifyAfterStore(definition, admission.answers, plan.notification);
	}
	log.info("submission.stored", {
		formId: form.id,
		submissionId: key.id,
		revision: key.revision,
		isNew: plan.isNew,
	});
	return { submissionId: key.id, isNew: plan.isNew };
}

/** 저장은 이미 끝났으므로 알림 큐 실패가 제출을 실패시키지 않는다 (로그로 남긴다) */
async function notifyAfterStore(
	...args: Parameters<typeof enqueueNotification>
): Promise<void> {
	try {
		await enqueueNotification(...args);
	} catch (error) {
		const failure = classifyError(error);
		log.error("notification.enqueue_failed", {
			submissionId: args[2].submissionId,
			kind: args[2].kind,
			code: failure.code,
			error: failure.internalMessage,
		});
		captureException(failure, "submit.enqueue_notification");
	}
}
