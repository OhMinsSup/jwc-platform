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
