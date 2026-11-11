import type { FormDefinition } from "../definition/definition";
import type { FieldDef } from "../definition/fields";
import { isDisplayOnly } from "../definition/fields";
import {
	SYSTEM_COLUMN_TABLE,
	systemColumnOf,
} from "../definition/system-columns";
import type {
	SystemColumn,
	SystemColumnKey,
} from "../definition/system-columns";
import {
	fieldSheetColumns,
	partCellOf,
	sheetCellOf,
} from "../field-types/values";
import type { FieldSheetColumn, SheetCellInfo } from "../field-types/values";
import { SYSTEM_CELLS } from "./system-cells";

/**
 * 시트 열 하나. 질문 열의 part는 답변의 어느 부분을 담는지:
 * "whole" = 답변 전체, "date"/"time" = 일시 답변의 날짜/시간 (fieldSheetColumns).
 * legacyOnly 열은 새 탭에 만들지 않고, 이전 버전이 만든 탭에 있으면 읽고 쓴다.
 */
export type SheetColumn =
	| { kind: "system"; key: SystemColumnKey; header: string }
	| {
			kind: "field";
			field: FieldDef;
			header: string;
			part: FieldSheetColumn["part"];
			legacyOnly: boolean;
	  };

function toSheetColumn(column: SystemColumn): SheetColumn {
	return { kind: "system", key: column.key, header: column.header };
}

/** 이 폼에 두는 운영 컬럼 중 한 배치(앞/뒤)의 것들 (표 순서대로) */
function systemColumnsAt(
	definition: FormDefinition,
	placement: SystemColumn["placement"],
): SheetColumn[] {
	return SYSTEM_COLUMN_TABLE.filter(
		(column) =>
			column.placement === placement &&
			(!column.requiresPayment || definition.payment !== undefined),
	).map(toSheetColumn);
}

/** 표시되는 질문들 (페이지 순서 → 페이지 안 순서) */
function displayedFields(definition: FormDefinition): FieldDef[] {
	const byId = new Map(definition.fields.map((field) => [field.id, field]));
	return definition.pages
		.flatMap((page) => page.fieldIds)
		.map((id) => byId.get(id))
		.filter(
			(field): field is FieldDef =>
				field !== undefined && !isDisplayOnly(field),
		);
}

/** 이미 쓰인 헤더를 쓰는 열은 버린다 (먼저 나온 열이 이긴다) */
function withoutTakenHeaders(columns: SheetColumn[]): SheetColumn[] {
	const taken = new Set<string>();
	return columns.filter((column) => {
		const headers = acceptedHeaders(column);
		if (headers.some((header) => taken.has(header))) {
			return false;
		}
		for (const header of headers) {
			taken.add(header);
		}
		return true;
	});
}

/**
 * 시트 컬럼 구성은 정의에서 결정적으로 파생된다 (별도 저장 불필요).
 * 순서: 앞쪽 운영 컬럼(ID, 신청일시), 질문(표시 순서, 일시는 날짜·시간 열), 뒤쪽 운영 컬럼(납입여부)
 *
 * 헤더가 겹치면 먼저 나온 열이 이긴다: 운영 컬럼 → 앞쪽 질문 순. 새 정의는 무결성 검사가 겹침을 막고,
 * 규칙이 생기기 전에 발행된 옛 정의만 여기에 걸린다 (진 질문 열은 시트에 쓰이지 않는다).
 */
export function sheetColumns(definition: FormDefinition): SheetColumn[] {
	const fields: SheetColumn[] = displayedFields(definition).flatMap((field) =>
		fieldSheetColumns(field).map((column) => ({
			kind: "field" as const,
			field,
			...column,
		})),
	);
	return withoutTakenHeaders([
		...systemColumnsAt(definition, "start"),
		...systemColumnsAt(definition, "end"),
		...fields,
	]).toSorted(byPlacement);
}

/** 배치 순서: 앞쪽 운영 컬럼, 질문, 뒤쪽 운영 컬럼 (겹침 판정 순서와 배치 순서가 다르다) */
function byPlacement(a: SheetColumn, b: SheetColumn): number {
	return placementRank(a) - placementRank(b);
}

function placementRank(column: SheetColumn): number {
	if (column.kind === "field") {
		return 1;
	}
	return systemColumnOf(column.key).placement === "start" ? 0 : 2;
}

/** 새 탭에 만드는 열들 (이전 버전 전용 열 제외) */
function createdColumns(definition: FormDefinition): SheetColumn[] {
	return sheetColumns(definition).filter(
		(column) => column.kind === "system" || !column.legacyOnly,
	);
}

export function headerRow(definition: FormDefinition): string[] {
	return createdColumns(definition).map((column) => column.header);
}

/** 컬럼으로 인식하는 헤더들 (현재 이름 + 이전 버전 이름) */
export function acceptedHeaders(column: SheetColumn): readonly string[] {
	return column.kind === "system"
		? [column.header, ...systemColumnOf(column.key).legacyHeaders]
		: [column.header];
}

export function findColumnByHeader(
	definition: FormDefinition,
	header: string,
): SheetColumn | undefined {
	const trimmed = header.trim();
	return sheetColumns(definition).find((column) =>
		acceptedHeaders(column).includes(trimmed),
	);
}

/** 정의에는 있지만 시트 헤더에 (이전 이름으로도) 없는 컬럼의 헤더 */
export function missingHeaders(
	definition: FormDefinition,
	sheetHeaders: readonly string[],
): string[] {
	const present = new Set(sheetHeaders.map((header) => header.trim()));
	return createdColumns(definition)
		.filter(
			(column) =>
				!acceptedHeaders(column).some((header) => present.has(header)),
		)
		.map((column) => column.header);
}

/** 운영 컬럼의 위치(0부터). 이전 이름도 찾는다. 없으면 -1 */
export function systemColumnIndex(
	sheetHeaders: readonly string[],
	key: SystemColumnKey,
): number {
	const accepted = acceptedHeaders(toSheetColumn(systemColumnOf(key)));
	return sheetHeaders.findIndex((header) => accepted.includes(header.trim()));
}

/** 열의 시트 칸 정보 (값 종류, 드롭다운 선택지). 운영 컬럼은 모두 글자 칸이다 */
export function columnCellOf(column: SheetColumn): SheetCellInfo {
	if (column.kind === "field") {
		return column.part === "whole"
			? sheetCellOf(column.field)
			: partCellOf(column.part);
	}
	return {
		value: "text",
		choices: SYSTEM_CELLS[column.key].choices ?? null,
		parts: null,
	};
}
