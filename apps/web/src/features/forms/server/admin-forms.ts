import { randomId } from "@jwc/common/encoding";
import { parseFormDefinition } from "@jwc/form-core/definition/definition";
import type { FormDefinitionInput } from "@jwc/form-core/definition/definition";
import { blankDefinition } from "@jwc/form-core/samples/blank";
import { retreat2026Definition } from "@jwc/form-core/samples/retreat-2026";
import { SubmissionStoreError } from "@jwc/submission-store";
import type { BoundSubmissionStore } from "@jwc/submission-store/bound";

import { ConflictError } from "../../../platform/server/errors/conflict-error";
import { DomainError } from "../../../platform/server/errors/domain-error";
import { InvalidInputError } from "../../../platform/server/errors/invalid-input-error";
import { NotFoundError } from "../../../platform/server/errors/not-found-error";
import { log } from "../../../platform/server/log";
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
import { responseSheetOf, responseStore } from "./response-store";
import { firstFreeSheetName } from "./sheet-availability";

export const FORM_TEMPLATES = {
	blank: (title: string): FormDefinitionInput => blankDefinition(title),
	retreat2026: (title: string): FormDefinitionInput => ({
		...structuredClone(retreat2026Definition),
		title,
	}),
} as const;
export type FormTemplate = keyof typeof FORM_TEMPLATES;

export async function requireForm(id: string): Promise<FormRow> {
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
	// 새 폼은 기본 스프레드시트의 주소 이름 탭에 저장한다 (겹치면 번호를 붙인다. 설정 화면에서 바꿀 수 있다)
	const sheetName = await firstFreeSheetName(input.slug);
	const id = randomId();
	const outcome = await insertForm({
		id,
		slug: input.slug,
		status: "draft",
		draftDefinition: FORM_TEMPLATES[input.template](input.title),
		sheetName,
		createdAt: now,
		updatedAt: now,
	});
	// 확인과 저장 사이에 다른 관리자가 같은 주소/탭으로 만들었으면 DB 유니크 인덱스가 막는다
	if (outcome === "taken") {
		throw new ConflictError(
			"방금 같은 주소나 시트 탭으로 만든 폼이 있습니다. 다시 시도해주세요",
		);
	}
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
	await prepareStore(responseStore(responseSheetOf(form), parsed.definition));
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
export async function prepareStore(store: BoundSubmissionStore): Promise<void> {
	try {
		await store.prepare();
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
