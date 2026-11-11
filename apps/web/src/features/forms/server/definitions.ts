import { parseStoredFormDefinition } from "@jwc/form-core/definition/definition";
import type { FormDefinition } from "@jwc/form-core/definition/definition";

import { NotFoundError } from "../../../platform/server/errors/not-found-error";
import { log } from "../../../platform/server/log";
import type { ResponseSheet } from "../domain/sheet-location";
import {
	findFormById,
	findFormBySlug,
	findVersion,
	listOpenForms,
} from "./forms-repository";
import type { FormRow } from "./forms-repository";
import { responseSheetOf } from "./response-store";

export interface PublishedForm {
	definition: FormDefinition;
	form: FormRow;
	/** 응답을 읽고 쓰는 실제 위치 (기본 스프레드시트를 채운 값) */
	sheet: ResponseSheet;
	versionId: string;
}

/**
 * 발행된 정의 로드. DB에 저장된 값도 경계에서 다시 검증한다
 * (스키마 버전 변경이나 수동 수정으로 깨진 데이터를 런타임에 신뢰하지 않기 위함).
 */
async function loadPublished(
	form: FormRow | undefined,
): Promise<PublishedForm> {
	if (!form?.publishedVersionId) {
		throw new NotFoundError("폼을 찾을 수 없습니다");
	}
	const version = await findVersion(form.publishedVersionId);
	if (!version) {
		throw new NotFoundError("발행된 폼 버전을 찾을 수 없습니다");
	}
	const parsed = parseStoredFormDefinition(version.definition);
	if (!parsed.ok) {
		log.error("definition.corrupted", {
			formId: form.id,
			versionId: version.id,
			issues: parsed.issues.length,
		});
		throw new NotFoundError(
			"폼 정의가 손상되었습니다. 관리자에게 문의해주세요",
		);
	}
	return {
		form,
		versionId: version.id,
		definition: parsed.definition,
		sheet: responseSheetOf(form),
	};
}

export async function publishedFormBySlug(
	slug: string,
): Promise<PublishedForm> {
	return await loadPublished(await findFormBySlug(slug));
}

export async function publishedFormById(id: string): Promise<PublishedForm> {
	return await loadPublished(await findFormById(id));
}

/** 공개 목록용 요약. 손상된 정의는 목록에서 제외한다 (각 폼은 독립 조회라 병렬로 읽는다). */
export async function openFormSummaries(): Promise<
	{ slug: string; title: string; description: string }[]
> {
	const forms = await listOpenForms();
	const loaded = await Promise.all(
		forms.map(async (form) => {
			try {
				const { definition } = await loadPublished(form);
				return {
					slug: form.slug,
					title: definition.title,
					description: definition.description ?? "",
				};
			} catch {
				// loadPublished가 이미 로그를 남김
				return null;
			}
		}),
	);
	return loaded.filter((summary) => summary !== null);
}
