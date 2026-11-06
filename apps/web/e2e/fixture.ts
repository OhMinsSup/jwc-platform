import type { FormDefinitionInput } from "@jwc/form-core/definition/definition";

/**
 * E2E 전용 폼. 사용자의 로컬 데이터와 섞이지 않게 고정 id/slug를 쓰고,
 * 시드할 때 이 폼(과 그 응답 키)만 지우고 다시 넣는다.
 */
export const E2E_FORM = {
	id: "e2e-public-form",
	slug: "e2e-public-form",
	versionId: "e2e-public-form-v1",
	sheetName: "e2e-public-form",
} as const;

/** 날짜 범위를 고정해 달력이 항상 같은 달(2030년 1월)로 열리게 한다 */
export const E2E_DEFINITION: FormDefinitionInput = {
	schemaVersion: 1,
	title: "E2E 신청서",
	timezone: "Asia/Seoul",
	identity: { fieldId: "phone" },
	fields: [
		{
			id: "name",
			type: "short_text",
			label: "이름",
			required: true,
			maxLength: 20,
		},
		{ id: "phone", type: "phone", label: "전화번호", required: true },
		{
			id: "visit_date",
			type: "date",
			label: "방문 날짜",
			required: true,
			min: "2030-01-01",
			max: "2030-01-31",
		},
	],
	pages: [
		{
			id: "basic",
			title: "기본 정보",
			fieldIds: ["name", "phone", "visit_date"],
		},
	],
};
