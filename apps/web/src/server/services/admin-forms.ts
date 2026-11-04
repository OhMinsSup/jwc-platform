import { parseFormDefinition } from "@jwc/form-core";
import type { FormDefinitionInput } from "@jwc/form-core";
import { blankDefinition, retreat2026Definition } from "@jwc/form-core/samples";
import { queues } from "void/queues";

import { randomId } from "../encoding";
import {
	ConflictError,
	DomainError,
	InvalidInputError,
	NotFoundError,
} from "../errors";
import { GoogleAuthError } from "../google/service-account";
import { SheetsApiError } from "../google/sheets-client";
import { log } from "../log";
import {
	findFormById,
	findFormBySlug,
	insertForm,
	latestVersionNumber,
	publishVersion,
	updateDraft,
	updateStatus,
} from "../repositories/forms";
import type { FormRow } from "../repositories/forms";
import { findSubmission, setPaid } from "../repositories/submissions";
import { sheets } from "../runtime";
import { ensureSheetLayout } from "./sheet-store";

export const FORM_TEMPLATES = {
	blank: (title: string): FormDefinitionInput => blankDefinition(title),
	retreat2026: (title: string): FormDefinitionInput => ({
		...structuredClone(retreat2026Definition),
		title,
	}),
} as const;
export type FormTemplate = keyof typeof FORM_TEMPLATES;

async function requireForm(id: string): Promise<FormRow> {
	const form = await findFormById(id);
	if (!form) {
		throw new NotFoundError("폼을 찾을 수 없습니다");
	}
	return form;
}

export async function createForm(
	input: { slug: string; title: string; template: FormTemplate },
	now: number,
): Promise<string> {
	if (await findFormBySlug(input.slug)) {
		throw new ConflictError("이미 사용 중인 주소(slug)입니다");
	}
	const id = randomId();
	await insertForm({
		id,
		slug: input.slug,
		status: "draft",
		draftDefinition: FORM_TEMPLATES[input.template](input.title),
		sheetName: input.slug,
		createdAt: now,
		updatedAt: now,
	});
	return id;
}

/** 초안은 검증 실패해도 저장한다 (편집 도중 상태 보존). 검증 결과는 함께 반환한다. */
export async function saveDraft(formId: string, draft: unknown, now: number) {
	await requireForm(formId);
	await updateDraft(formId, draft, now);
	const parsed = parseFormDefinition(draft);
	return parsed.ok
		? { valid: true as const, issues: [] }
		: { valid: false as const, issues: parsed.issues };
}

/** 초안 → 불변 버전으로 발행. 시트 탭/헤더를 먼저 준비해 첫 제출이 실패하지 않게 한다. */
export async function publishDraft(
	formId: string,
	publishedBy: string,
	now: number,
): Promise<number> {
	const form = await requireForm(formId);
	const parsed = parseFormDefinition(form.draftDefinition);
	if (!parsed.ok) {
		const fieldErrors = Object.fromEntries(
			parsed.issues.map((issue) => [issue.path || "(root)", issue.message]),
		);
		throw new InvalidInputError(
			"정의에 오류가 있어 발행할 수 없습니다",
			fieldErrors,
		);
	}
	await prepareSheet(form.sheetName, parsed.definition);
	const version = (await latestVersionNumber(formId)) + 1;
	await publishVersion(
		{
			id: randomId(),
			formId,
			version,
			definition: parsed.definition,
			publishedAt: now,
			publishedBy,
		},
		now,
	);
	log.info("form.published", { formId, version });
	return version;
}

const FORBIDDEN = 403;
const BAD_GATEWAY = 502;

/** 시트 준비 실패를 관리자가 조치할 수 있는 문장으로 바꾼다 */
async function prepareSheet(
	sheetName: string,
	definition: Parameters<typeof ensureSheetLayout>[2],
): Promise<void> {
	try {
		await ensureSheetLayout(sheets(), sheetName, definition);
	} catch (error) {
		if (error instanceof GoogleAuthError) {
			throw new DomainError(error.message, {
				status: BAD_GATEWAY,
				cause: error,
			});
		}
		if (error instanceof SheetsApiError && error.status === FORBIDDEN) {
			throw new DomainError(
				"서비스 계정에 스프레드시트 편집 권한을 공유해주세요",
				{ status: BAD_GATEWAY, cause: error },
			);
		}
		throw error;
	}
}

export async function setFormStatus(
	formId: string,
	status: "open" | "closed",
	now: number,
): Promise<void> {
	const form = await requireForm(formId);
	if (status === "open" && !form.publishedVersionId) {
		throw new ConflictError("발행된 버전이 없어 접수를 열 수 없습니다");
	}
	await updateStatus(formId, status, now);
}

/** 관리자 화면에서 납입 상태 변경 → D1 반영 후 시트 셀 갱신 요청 */
export async function markPaid(
	submissionId: string,
	paid: boolean,
	now: number,
): Promise<void> {
	if (!(await findSubmission(submissionId))) {
		throw new NotFoundError("응답을 찾을 수 없습니다");
	}
	await setPaid(submissionId, paid, now);
	await queues.sheets.send({ kind: "paid", submissionId, paid });
}
