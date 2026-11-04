import type { FormDefinition } from "../definition/definition";

/** 새 폼의 시작점: 이름 + 전화번호(식별 키) 한 페이지 */
export function blankDefinition(title: string): FormDefinition {
	return {
		schemaVersion: 1,
		title,
		timezone: "Asia/Seoul",
		identity: { fieldId: "phone" },
		fields: [
			{
				id: "name",
				type: "short_text",
				label: "이름",
				required: true,
				maxLength: 200,
			},
			{ id: "phone", type: "phone", label: "전화번호", required: true },
		],
		pages: [{ id: "basic", title: "기본 정보", fieldIds: ["name", "phone"] }],
	};
}
