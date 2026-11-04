import { parseFormDefinition } from "@jwc/form-core";
import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { keysOf } from "../lib/object";
import { NotFoundError } from "../server/errors";
import {
	findFormById,
	findVersion,
	listForms,
} from "../server/repositories/forms";
import { spreadsheetUrl } from "../server/runtime";
import {
	createForm,
	FORM_TEMPLATES,
	markPaid,
	publishDraft,
	saveDraft,
	setFormStatus,
} from "../server/services/admin-forms";
import { listSubmissionRows } from "../server/services/admin-submissions";
import { currentAdmin, requireAdmin } from "../server/session";
import { toResult } from "./result";

/** 모든 관리자 서버 함수 앞단: 세션 + 허용 목록 검사 */
const adminOnly = createMiddleware({ type: "function" }).server(
	async ({ next }) => await next({ context: { admin: await requireAdmin() } }),
);

const ID = z.string().regex(/^[A-Za-z0-9_-]{10,40}$/u);
const SLUG = z
	.string()
	.regex(/^[a-z0-9][a-z0-9-]{1,60}$/u, "소문자/숫자/하이픈 2~61자");
const TEMPLATE = z.enum(keysOf(FORM_TEMPLATES));

/** 초안은 검증 실패 상태일 수 있으므로 제목만 방어적으로 꺼낸다 */
function draftTitle(draft: unknown): string | undefined {
	if (typeof draft !== "object" || draft === null || !("title" in draft)) {
		return undefined;
	}
	const { title } = draft;
	return typeof title === "string" && title.trim() !== "" ? title : undefined;
}

export const getAdminSessionFn = createServerFn({ method: "GET" }).handler(() =>
	currentAdmin(),
);

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
	.handler(({ data }) =>
		toResult("admin.createForm", () => createForm(data, Date.now())),
	);

/** 폼 공통 레이아웃(제목/상태/탭)용 가벼운 요약 */
export const getFormSummaryFn = createServerFn({ method: "GET" })
	.middleware([adminOnly])
	.validator(z.object({ formId: ID }))
	.handler(({ data }) =>
		toResult("admin.getFormSummary", async () => {
			const form = await findFormById(data.formId);
			if (!form) {
				throw new NotFoundError("폼을 찾을 수 없습니다");
			}
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
			const form = await findFormById(data.formId);
			if (!form) {
				throw new NotFoundError("폼을 찾을 수 없습니다");
			}
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

/** 초안 JSON 문자열을 받아 파싱만 경계에서 하고, 정의 검증은 서비스가 수행 */
export const saveDraftFn = createServerFn({ method: "POST" })
	.middleware([adminOnly])
	.validator(z.object({ formId: ID, draftJson: z.string().max(500_000) }))
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
			publishDraft(data.formId, context.admin.email, Date.now()),
		),
	);

export const setFormStatusFn = createServerFn({ method: "POST" })
	.middleware([adminOnly])
	.validator(z.object({ formId: ID, status: z.enum(["open", "closed"]) }))
	.handler(({ data }) =>
		toResult("admin.setStatus", () =>
			setFormStatus(data.formId, data.status, Date.now()),
		),
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
	.handler(({ data }) =>
		toResult("admin.markPaid", () =>
			markPaid(data.submissionId, data.paid, Date.now()),
		),
	);

/** 초안 미리보기: 저장된 초안을 검증해 렌더링 가능한 정의로 돌려준다 */
export const getDraftPreviewFn = createServerFn({ method: "GET" })
	.middleware([adminOnly])
	.validator(z.object({ formId: ID }))
	.handler(({ data }) =>
		toResult("admin.preview", async () => {
			const form = await findFormById(data.formId);
			if (!form) {
				throw new NotFoundError("폼을 찾을 수 없습니다");
			}
			return parseFormDefinition(form.draftDefinition);
		}),
	);
