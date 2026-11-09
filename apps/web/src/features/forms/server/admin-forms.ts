import { randomId } from "@jwc/common/encoding";
import { parseFormDefinition } from "@jwc/form-core/definition/definition";
import type { FormDefinitionInput } from "@jwc/form-core/definition/definition";
import { blankDefinition } from "@jwc/form-core/samples/blank";
import { retreat2026Definition } from "@jwc/form-core/samples/retreat-2026";
import { SubmissionStoreError } from "@jwc/submission-store";
import type { StoreTarget } from "@jwc/submission-store";

import { ConflictError } from "../../../platform/server/errors/conflict-error";
import { DomainError } from "../../../platform/server/errors/domain-error";
import { InvalidInputError } from "../../../platform/server/errors/invalid-input-error";
import { NotFoundError } from "../../../platform/server/errors/not-found-error";
import { log } from "../../../platform/server/log";
import { submissionStore } from "../../../platform/server/runtime";
import { storeTargetOf } from "./definitions";
import {
	findFormById,
	findFormBySlug,
	insertForm,
	latestVersionNumber,
	publishVersion,
	updateDraft,
	updateStatus,
} from "./forms-repository";
import type { FormRow } from "./forms-repository";

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
	await prepareStore(storeTargetOf(form, parsed.definition));
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

/** 저장소 준비 실패 중 운영자가 조치할 수 있는 것(권한/구조)은 그 문장을 그대로 보여 준다 */
async function prepareStore(target: StoreTarget): Promise<void> {
	try {
		await submissionStore().prepare(target);
	} catch (error) {
		if (
			error instanceof SubmissionStoreError &&
			(error.failure === "forbidden" || error.failure === "layout")
		) {
			throw new DomainError(error.message, {
				code: "store_misconfigured",
				cause: error,
			});
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
