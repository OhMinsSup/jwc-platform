import { clientIpOf } from "@jwc/security/rate-limit";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { z } from "zod";

import { turnstileConfig } from "../../platform/server/runtime";
import { enforceRateLimit } from "../../platform/server/security/rate-limit";
import { assertHuman } from "../../platform/server/security/turnstile";
import { toResult } from "../../platform/server/server-fn";
import { ID, SLUG } from "../../platform/server/validation";
import { adminOnly } from "../admin-access/server/admin-only";
import { audited } from "../admin-access/server/audit";
import { listSubmissionRows } from "./server/admin-submissions";
import { markPaid } from "./server/mark-paid";
import { loadSubmissionView } from "./server/submission-view";
import { submitAnswers } from "./server/submit";

/**
 * 응답 기능의 서버 함수 경계: 공개 제출/신청 내역 조회, 관리자 응답 목록/납입 변경.
 */

const MAX_ANSWER_KEYS = 200;
const MAX_ANSWER_KEY_LENGTH = 40;
/** 답변 값 상한: 가장 긴 장문 답변보다 넉넉하게, 대량 페이로드는 경계에서 거절 */
const MAX_TEXT_LENGTH = 5000;
const MAX_CHOICES = 100;
const MAX_CHOICE_LENGTH = 200;
const MAX_TOKEN_LENGTH = 2048;

/** 답변 값 모양만 경계에서 제한한다 (필드별 의미 검증은 form-core validateAnswers) */
const AnswerValue = z.union([
	z.string().max(MAX_TEXT_LENGTH),
	z.number(),
	z.boolean(),
	z.null(),
	z.array(z.string().max(MAX_CHOICE_LENGTH)).max(MAX_CHOICES),
]);

export const submitFormFn = createServerFn({ method: "POST" })
	.validator(
		z.object({
			slug: SLUG,
			answers: z
				.record(z.string().max(MAX_ANSWER_KEY_LENGTH), AnswerValue)
				.refine((value) => Object.keys(value).length <= MAX_ANSWER_KEYS),
			turnstileToken: z.string().max(MAX_TOKEN_LENGTH).optional(),
		}),
	)
	.handler(({ data }) =>
		toResult("public.submit", async () => {
			const now = Date.now();
			const ip = clientIpOf(getRequestHeaders());
			await enforceRateLimit("submit", `${data.slug}:${ip}`, now);
			await assertHuman(turnstileConfig(), data.turnstileToken, ip);
			return await submitAnswers(data.slug, data.answers, now);
		}),
	);

export const getSubmissionViewFn = createServerFn({ method: "GET" })
	.validator(z.object({ id: ID }))
	.handler(({ data }) =>
		toResult("public.submissionView", async () => {
			await enforceRateLimit(
				"submission_view",
				clientIpOf(getRequestHeaders()),
				Date.now(),
			);
			return await loadSubmissionView(data.id);
		}),
	);

export const listSubmissionsFn = createServerFn({ method: "GET" })
	.middleware([adminOnly])
	.validator(z.object({ formId: ID }))
	.handler(({ data }) =>
		toResult("admin.listSubmissions", () => listSubmissionRows(data.formId)),
	);

export const markPaidFn = createServerFn({ method: "POST" })
	.middleware([adminOnly])
	.validator(z.object({ submissionId: ID, paid: z.boolean() }))
	.handler(({ data, context }) =>
		toResult("admin.markPaid", () =>
			audited(
				context.admin,
				() => ({
					action: "submission.paid_changed",
					targetType: "submission",
					targetId: data.submissionId,
					detail: { paid: data.paid },
				}),
				() => markPaid(data.submissionId, data.paid),
			),
		),
	);
