import type { FormDefinition } from "../definition/definition";
import type { FieldDef } from "../definition/fields";
import { columnHeaderOf, isDisplayOnly } from "../definition/fields";
import {
	SYSTEM_COLUMN_KEYS,
	SYSTEM_COLUMNS,
} from "../definition/system-columns";
import type { SystemColumnKey } from "../definition/system-columns";

export type SheetColumn =
	| { kind: "system"; key: SystemColumnKey; header: string }
	| { kind: "field"; field: FieldDef; header: string };

/** 시트 컬럼 구성은 정의에서 결정적으로 파생된다 (별도 저장 불필요) */
export function sheetColumns(definition: FormDefinition): SheetColumn[] {
	const system: SheetColumn[] = SYSTEM_COLUMN_KEYS.filter(
		(key) => key !== "paid" || definition.payment !== undefined,
	).map((key) => ({ kind: "system", key, header: SYSTEM_COLUMNS[key] }));

	const byId = new Map(definition.fields.map((field) => [field.id, field]));
	const fields: SheetColumn[] = definition.pages
		.flatMap((page) => page.fieldIds)
		.map((id) => byId.get(id))
		.filter(
			(field): field is FieldDef =>
				field !== undefined && !isDisplayOnly(field),
		)
		.map((field) => ({ kind: "field", field, header: columnHeaderOf(field) }));

	return [...system, ...fields];
}

export function headerRow(definition: FormDefinition): string[] {
	return sheetColumns(definition).map((column) => column.header);
}

export function findColumnByHeader(
	definition: FormDefinition,
	header: string,
): SheetColumn | undefined {
	return sheetColumns(definition).find(
		(column) => column.header === header.trim(),
	);
}
