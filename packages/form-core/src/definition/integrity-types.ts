import type { FieldDef } from "./fields";

export interface IntegrityIssue {
	message: string;
	path: (string | number)[];
}

/** integrity 검사가 필요로 하는 최소 형태 (zod 출력 이전 단계에서도 동작하도록) */
export interface DefinitionShape {
	contact?: { phoneFieldId: string };
	fields: FieldDef[];
	identity: { fieldId: string };
	notifications?: { onCreate?: string; onUpdate?: string };
	pages: { id: string; fieldIds: string[]; showIf?: FieldDef["showIf"] }[];
	payment?: {
		amount:
			| { kind: "fixed"; value: number }
			| { kind: "byOption"; fieldId: string; amounts: Record<string, number> };
	};
}

/** 시트 헤더 규칙: 편집·발행용과 저장된 정의용이 다르다 (definition.ts) */
export interface HeaderRules {
	/** 질문이 시트에서 쓰는 헤더들 (일시 질문은 날짜·시간 열 이름까지) */
	headersOf: (field: FieldDef) => readonly string[];
	/** 질문 헤더로 쓸 수 없는 이름 */
	reservedHeaders: readonly string[];
}
