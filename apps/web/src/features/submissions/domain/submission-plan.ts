import { validateAnswers } from "@jwc/form-core/answers/validate";
import type { Answers } from "@jwc/form-core/answers/value";
import type {
	FormDefinition,
	NotificationKind,
} from "@jwc/form-core/definition/definition";
import { contactPhone, identityKey } from "@jwc/form-core/identity";
import {
	messageVariables,
	renderTemplate,
	templateFor,
} from "@jwc/form-core/messaging";
import { localDateTimeIn } from "@jwc/form-core/time";
import type { SubmissionWrite } from "@jwc/submission-store";

/**
 * 제출 판단(순수 함수). I/O 없이 "무엇을 할지"를 데이터로 돌려주고,
 * services/submit.ts(해석기)가 그 데이터대로 D1/저장소/큐를 실행한다.
 */

export type FormStatus = "draft" | "open" | "closed";

export type Admission =
	| { ok: true; answers: Answers; identity: string }
	| { ok: false; reason: "closed" }
	| { ok: false; reason: "invalid"; fieldErrors: Record<string, string> }
	| { ok: false; reason: "missing_identity" };

/** 접수 가능 여부 → 답변 검증 → 식별값 추출 */
export function admitSubmission(
	definition: FormDefinition,
	status: FormStatus,
	raw: Record<string, unknown>,
	now: number,
): Admission {
	const closed =
		status !== "open" ||
		(definition.closesAt !== undefined &&
			localDateTimeIn(now, definition.timezone) > definition.closesAt);
	if (closed) {
		return { ok: false, reason: "closed" };
	}
	const validation = validateAnswers(definition, raw);
	if (!validation.ok) {
		return { ok: false, reason: "invalid", fieldErrors: validation.errors };
	}
	const identity = identityKey(definition, validation.answers);
	return identity
		? { ok: true, answers: validation.answers, identity }
		: { ok: false, reason: "missing_identity" };
}

/** D1에서 claim한 키 상태 (repositories/submission-keys의 ClaimedKey와 같은 모양) */
export interface KeyState {
	createdAt: number;
	id: string;
	revision: number;
	storedAt: number | null;
}

/** 보낼 알림 1건 (렌더링 전). 멱등 키가 같으면 한 번만 발송된다 */
export interface NotificationIntent {
	idempotencyKey: string;
	kind: NotificationKind;
	submissionId: string;
}

export interface SubmissionPlan {
	isNew: boolean;
	notification: NotificationIntent | null;
	record: SubmissionWrite;
}

/**
 * 저장할 레코드와 알림을 정한다.
 * - 한 번도 저장된 적 없는 키면 신규(납입 "미납"으로 시작, onCreate)
 * - 재제출이면 납입 여부를 쓰지 않는다(운영자가 시트에서 바꾼 값을 보존, onUpdate)
 */
export function planSubmissionWrite(
	definition: FormDefinition,
	key: KeyState,
	answers: Answers,
	now: number,
): SubmissionPlan {
	const isNew = key.storedAt === null;
	const kind: NotificationKind = isNew ? "onCreate" : "onUpdate";
	return {
		isNew,
		record: {
			id: key.id,
			answers,
			submittedAt: key.createdAt,
			updatedAt: now,
			paid: isNew ? false : undefined,
		},
		notification: notificationFor(definition, answers, {
			kind,
			submissionId: key.id,
			idempotencyKey: `${key.id}:${kind}:${key.revision}`,
		}),
	};
}

/** 템플릿과 연락처가 있을 때만 알림을 만든다 */
export function notificationFor(
	definition: FormDefinition,
	answers: Answers,
	intent: NotificationIntent,
): NotificationIntent | null {
	const hasTemplate = Boolean(templateFor(definition, intent.kind));
	return hasTemplate && contactPhone(definition, answers) ? intent : null;
}

/** 발송할 문자 (수신 번호 + 본문). 템플릿/연락처가 없으면 null */
export function composeSms(
	definition: FormDefinition,
	answers: Answers,
	intent: NotificationIntent,
	link: string,
): { to: string; text: string } | null {
	const template = templateFor(definition, intent.kind);
	const to = contactPhone(definition, answers);
	if (!(template && to)) {
		return null;
	}
	const variables = messageVariables(definition, answers, {
		submissionId: intent.submissionId,
		link,
	});
	return { to, text: renderTemplate(template, variables) };
}
