import { keysOf } from "@jwc/common/object";
import { parseFormDefinition } from "@jwc/form-core/definition/definition";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { NotFoundError } from "../../../platform/server/errors/not-found-error";
import { log } from "../../../platform/server/log";
import { spreadsheetUrl } from "../../../platform/server/runtime";
import { toResult } from "../../../platform/server/server-fn";
import { ID, SLUG } from "../../../platform/server/validation";
import { adminOnly } from "../../admin-access/server/admin-only";
import { audited } from "../../admin-access/server/audit";
import {
	createForm,
	FORM_TEMPLATES,
	publishDraft,
	saveDraft,
	setFormStatus,
} from "../server/admin-forms";
import {
	findFormById,
	findVersion,
	listForms,
} from "../server/forms-repository";
import type { FormRow } from "../server/forms-repository";

/**
 * 폼 관리(관리자) 서버 함수 경계. 바꾸는 작업은 audited로 감사 기록을 함께 남긴다.
 */

const TEMPLATE = z.enum(keysOf(FORM_TEMPLATES));
const MAX_DRAFT_JSON = 500_000;

/** 초안은 검증 실패 상태일 수 있으므로 제목만 방어적으로 꺼낸다 */
function draftTitle(draft: unknown): string | undefined {
	if (typeof draft !== "object" || draft === null || !("title" in draft)) {
		return undefined;
	}
	const { title } = draft;
	return typeof title === "string" && title.trim() !== "" ? title : undefined;
}

async function requireForm(formId: string): Promise<FormRow> {
	const form = await findFormById(formId);
	if (!form) {
		throw new NotFoundError("폼을 찾을 수 없습니다");
	}
	return form;
}

/**
 * 발행된 버전의 질문 id. 편집기는 이 id들의 변경을 막는다
 * (기존 응답, 알림 문구 변수, 진행 중인 큐 메시지가 id를 키로 쓰기 때문).
 */
async function publishedFieldIds(versionId: string | null): Promise<string[]> {
	if (!versionId) {
		return [];
	}
	const version = await findVersion(versionId);
	const parsed = parseFormDefinition(version?.definition);
	return parsed.ok ? parsed.definition.fields.map((field) => field.id) : [];
}

export const listFormsFn = createServerFn({ method: "GET" })
	.middleware([adminOnly])
	.handler(async () => {
		const rows = await listForms();
		return rows.map((row) => ({
			id: row.id,
			slug: row.slug,
			status: row.status,
			published: row.publishedVersionId !== null,
			submissionCount: row.submissionCount,
			updatedAt: row.updatedAt,
			title: draftTitle(row.draftDefinition) ?? row.slug,
		}));
	});

export const createFormFn = createServerFn({ method: "POST" })
	.middleware([adminOnly])
	.validator(
		z.object({
			slug: SLUG,
			title: z.string().trim().min(1).max(100),
			template: TEMPLATE,
		}),
	)
	.handler(({ data, context }) =>
		toResult("admin.createForm", async () => {
			const createdFormId = await audited(
				context.admin,
				(formId) => ({
					action: "form.created",
					targetType: "form",
					targetId: formId,
					detail: { template: data.template },
				}),
				() => createForm(data, Date.now()),
			);
			log.info("form.created", {
				formId: createdFormId,
				template: data.template,
			});
			return createdFormId;
		}),
	);

/** 폼 공통 레이아웃(제목/상태/탭)용 가벼운 요약 */
export const getFormSummaryFn = createServerFn({ method: "GET" })
	.middleware([adminOnly])
	.validator(z.object({ formId: ID }))
	.handler(({ data }) =>
		toResult("admin.getFormSummary", async () => {
			const form = await requireForm(data.formId);
			return {
				id: form.id,
				slug: form.slug,
				status: form.status,
				published: form.publishedVersionId !== null,
				title: draftTitle(form.draftDefinition) ?? form.slug,
				spreadsheetUrl: spreadsheetUrl(),
			};
		}),
	);

export const getFormEditorFn = createServerFn({ method: "GET" })
	.middleware([adminOnly])
	.validator(z.object({ formId: ID }))
	.handler(({ data }) =>
		toResult("admin.getFormEditor", async () => {
			const form = await requireForm(data.formId);
			return {
				id: form.id,
				slug: form.slug,
				status: form.status,
				sheetName: form.sheetName,
				published: form.publishedVersionId !== null,
				/** 전송용 직렬화. 편집은 클라이언트에서 객체로 한다 */
				draftJson: JSON.stringify(form.draftDefinition),
				publishedFieldIds: await publishedFieldIds(form.publishedVersionId),
				spreadsheetUrl: spreadsheetUrl(),
			};
		}),
	);

/** 초안 JSON 문자열을 받아 파싱만 경계에서 하고, 정의 검증은 서비스가 수행 */
export const saveDraftFn = createServerFn({ method: "POST" })
	.middleware([adminOnly])
	.validator(
		z.object({ formId: ID, draftJson: z.string().max(MAX_DRAFT_JSON) }),
	)
	.handler(({ data }) =>
		toResult("admin.saveDraft", async () => {
			let draft: unknown;
			try {
				draft = JSON.parse(data.draftJson);
			} catch {
				return {
					valid: false as const,
					issues: [{ path: "(json)", message: "JSON 문법 오류입니다" }],
				};
			}
			return await saveDraft(data.formId, draft, Date.now());
		}),
	);

export const publishFormFn = createServerFn({ method: "POST" })
	.middleware([adminOnly])
	.validator(z.object({ formId: ID }))
	.handler(({ data, context }) =>
		toResult("admin.publish", () =>
			audited(
				context.admin,
				(version) => ({
					action: "form.published",
					targetType: "form",
					targetId: data.formId,
					detail: { version },
				}),
				() => publishDraft(data.formId, context.admin.email, Date.now()),
			),
		),
	);

export const setFormStatusFn = createServerFn({ method: "POST" })
	.middleware([adminOnly])
	.validator(z.object({ formId: ID, status: z.enum(["open", "closed"]) }))
	.handler(({ data, context }) =>
		toResult("admin.setStatus", async () => {
			await audited(
				context.admin,
				() => ({
					action: "form.status_changed",
					targetType: "form",
					targetId: data.formId,
					detail: { status: data.status },
				}),
				() => setFormStatus(data.formId, data.status, Date.now()),
			);
			log.info("form.status_changed", {
				formId: data.formId,
				status: data.status,
			});
		}),
	);

/** 초안 미리보기: 저장된 초안을 검증해 렌더링 가능한 정의로 돌려준다 */
export const getDraftPreviewFn = createServerFn({ method: "GET" })
	.middleware([adminOnly])
	.validator(z.object({ formId: ID }))
	.handler(({ data }) =>
		toResult("admin.preview", async () => {
			const form = await requireForm(data.formId);
			return parseFormDefinition(form.draftDefinition);
		}),
	);
