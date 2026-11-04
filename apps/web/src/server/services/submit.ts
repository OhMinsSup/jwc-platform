import {
	contactPhone,
	identityKey,
	localDateTimeIn,
	validateAnswers,
} from "@jwc/form-core";
import type { FormDefinition } from "@jwc/form-core";
import { queues } from "void/queues";

import { encryptJson, encryptText, hmacHex } from "../crypto";
import { randomId } from "../encoding";
import { FormClosedError, InvalidInputError } from "../errors";
import { log } from "../log";
import type { SheetSyncPayload } from "../messages";
import type { FormRow } from "../repositories/forms";
import { upsertSubmission } from "../repositories/submissions";
import { dataKeys } from "../runtime";
import { publishedFormBySlug } from "./definitions";

export interface SubmitResult {
	isNew: boolean;
	submissionId: string;
}

/** 접수 중(open)이고 마감 시각(폼 타임존 기준) 전일 때만 받는다 */
function assertAcceptingSubmissions(
	status: FormRow["status"],
	definition: FormDefinition,
	now: number,
): void {
	if (status !== "open") {
		throw new FormClosedError();
	}
	if (
		definition.closesAt &&
		localDateTimeIn(now, definition.timezone) > definition.closesAt
	) {
		throw new FormClosedError();
	}
}

/**
 * 제출 처리: 검증 → 인덱스 upsert(D1) → 시트 반영 요청(큐).
 * 답변 원문은 D1에 저장하지 않고 암호화하여 큐로만 전달한다.
 */
export async function submitAnswers(
	slug: string,
	raw: Record<string, unknown>,
	now: number,
): Promise<SubmitResult> {
	const { form, versionId, definition } = await publishedFormBySlug(slug);
	assertAcceptingSubmissions(form.status, definition, now);

	const validation = validateAnswers(definition, raw);
	if (!validation.ok) {
		throw new InvalidInputError("입력값을 확인해주세요", validation.errors);
	}
	const identity = identityKey(definition, validation.answers);
	if (!identity) {
		throw new InvalidInputError("식별 항목이 비어 있습니다");
	}

	const keys = await dataKeys();
	const phone = contactPhone(definition, validation.answers);
	const { id, revision } = await upsertSubmission({
		id: randomId(),
		formId: form.id,
		formVersionId: versionId,
		identityHash: await hmacHex(keys.identity, `${form.id}:${identity}`),
		contactCipher: phone ? await encryptText(keys.encryption, phone) : null,
		now,
	});
	const isNew = revision === 1;

	const payload: SheetSyncPayload = {
		answers: validation.answers,
		notify: isNew ? "onCreate" : "onUpdate",
	};
	await queues.sheets.send({
		kind: "upsert",
		submissionId: id,
		revision,
		payload: await encryptJson(keys.encryption, payload),
	});

	log.info("submission.accepted", {
		formId: form.id,
		submissionId: id,
		revision,
		isNew,
	});
	return { submissionId: id, isNew };
}
