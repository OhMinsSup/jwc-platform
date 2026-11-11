import type { FormDefinition } from "@jwc/form-core/definition/definition";
import {
	columnCellOf,
	findColumnByHeader,
	missingHeaders,
} from "@jwc/form-core/sheet/columns";
import type { SheetColumn } from "@jwc/form-core/sheet/columns";
import type {
	GridSpan,
	SheetInfo,
	TableColumnProperties,
	TableInfo,
} from "@jwc/google/sheet-info";

import {
	columnWidthOf,
	TABLE_COLUMN_TYPES,
	VALUE_FORMATS,
} from "./sheet-style";
import type { NumberFormat, TableColumnType } from "./sheet-style";

/**
 * 응답 탭 준비 계획 (순수 함수). 지금 탭 상태 + 정의 → "무엇을 할지"를 값으로 돌려준다.
 * 응답은 시트의 "표"(데이터 테이블)로 둔다: 머리글 색·줄무늬·필터·열 타입·드롭다운을 표가 관리한다.
 * 실행(API 요청으로 바꾸기)은 layout-requests.ts, 읽기/쓰기는 sheet-layout.ts가 한다.
 *
 * 운영자가 고친 것은 덮지 않는다:
 * - A1에서 시작하는 표가 있으면 그 표를 쓴다. 새 열이 생길 때만 범위를 넓히고, 기존 열의 타입은 그대로 둔다.
 * - 열 너비와 글자 서식은 새 열에만 건다. 날짜·시간 서식은 값이 일련번호라 기존 열에도 다시 건다.
 * - A1이 아닌 곳에 다른 표가 있는 탭은 겹칠 수 있어 표를 만들지 않고 1행 고정만 한다.
 */

export interface TabState {
	/** 탭이 없으면 undefined */
	info: SheetInfo | undefined;
	/** 지금 1행의 헤더 (탭이 없으면 빈 배열) */
	headers: string[];
	/** 값이 있는 행 수 (머리글 포함) */
	rowCount: number;
	/** 스프레드시트의 모든 표 이름 (표 이름은 스프레드시트 안에서 겹칠 수 없다) */
	tableNames: ReadonlySet<string>;
}

interface TableColumnSpec {
	columnIndex: number;
	columnName: string;
	columnType: TableColumnType;
	dataValidationRule?: {
		condition: {
			type: "ONE_OF_LIST";
			values: { userEnteredValue: string }[];
		};
	};
}

export type TablePlan =
	| {
			action: "create";
			name: string;
			/** 표가 덮을 행 수 (머리글 + 기존 응답, 최소 본문 1행) */
			rowCount: number;
			columns: TableColumnSpec[];
			/** 표와 겹치면 안 되는 이전 버전의 줄무늬(A1에서 시작)와 기본 필터 */
			removeBandingIds: number[];
			clearBasicFilter: boolean;
	  }
	| {
			action: "extend";
			tableId: string;
			range: GridSpan;
			/** 기존 열 속성(운영자 설정 그대로) + 새 열 속성. API는 배열 전체를 바꾼다 */
			columnProperties: (TableColumnProperties | TableColumnSpec)[];
	  }
	| { action: "keep" }
	| { action: "skip" };

export interface ColumnPlan {
	index: number;
	/** 걸 서식. null이면 건드리지 않는다 */
	numberFormat: NumberFormat | null;
	/** 걸 너비(px). null이면 건드리지 않는다 */
	width: number | null;
}

export interface SheetLayoutPlan {
	columns: ColumnPlan[];
	/** 새로 더하는 첫 열의 위치(0부터) */
	firstNewColumn: number;
	/** 준비 후의 전체 헤더 (기존 헤더 + 오른쪽에 더할 헤더) */
	headers: string[];
	table: TablePlan;
}

/** 표 본문이 최소 1행은 있어야 첫 응답이 표 안에 들어간다 */
const MIN_TABLE_ROWS = 2;
const TABLE_NAME_UNSAFE = /[^\p{L}\p{N}_]/gu;
const STARTS_WITH_DIGIT = /^\p{N}/u;
const FALLBACK_TABLE_NAME = "응답";

/** 이 앱이 쓰는 표: 탭의 A1에서 시작하는 표 */
export function ownTableOf(info: SheetInfo | undefined): TableInfo | undefined {
	return info?.tables.find(
		(table) =>
			table.range.startRowIndex === 0 && table.range.startColumnIndex === 0,
	);
}

/** 탭 이름 → 표 이름 (글자·숫자·밑줄만, 스프레드시트 안에서 겹치지 않게 번호를 붙인다) */
export function tableNameFor(
	sheetName: string,
	taken: ReadonlySet<string>,
): string {
	const cleaned =
		sheetName.replaceAll(TABLE_NAME_UNSAFE, "_") || FALLBACK_TABLE_NAME;
	const base = STARTS_WITH_DIGIT.test(cleaned) ? `표_${cleaned}` : cleaned;
	let name = base;
	for (let suffix = 2; taken.has(name); suffix += 1) {
		name = `${base}_${suffix}`;
	}
	return name;
}

function tableColumnSpec(
	column: SheetColumn | undefined,
	header: string,
	index: number,
): TableColumnSpec {
	const base = { columnIndex: index, columnName: header };
	if (!column) {
		return { ...base, columnType: "TEXT" };
	}
	const cell = columnCellOf(column);
	if (cell.choices === null) {
		return { ...base, columnType: TABLE_COLUMN_TYPES[cell.value] };
	}
	return {
		...base,
		columnType: "DROPDOWN",
		dataValidationRule: {
			condition: {
				type: "ONE_OF_LIST",
				values: cell.choices.map((value) => ({ userEnteredValue: value })),
			},
		},
	};
}

function tableColumns(
	definition: FormDefinition,
	headers: string[],
	from: number,
): TableColumnSpec[] {
	return headers
		.slice(from)
		.map((header, offset) =>
			tableColumnSpec(
				findColumnByHeader(definition, header),
				header,
				from + offset,
			),
		);
}

interface TableInput {
	definition: FormDefinition;
	headers: string[];
	sheetName: string;
	tab: TabState;
}

/** 이미 있는 응답 표: 새 열이 생길 때만 넓힌다 (기존 열 속성은 운영자 설정 그대로) */
function planExistingTable(
	own: TableInfo,
	definition: FormDefinition,
	headers: string[],
): TablePlan {
	const end = own.range.endColumnIndex ?? 0;
	if (headers.length <= end) {
		return { action: "keep" };
	}
	return {
		action: "extend",
		tableId: own.tableId,
		range: { ...own.range, endColumnIndex: headers.length },
		columnProperties: [
			...own.columnProperties,
			...tableColumns(definition, headers, end),
		],
	};
}

/** A1에서 시작하는 줄무늬 (이전 버전이 만든 것. 표와 겹치면 표를 만들 수 없다) */
function bandingsAtOrigin(info: SheetInfo | undefined): number[] {
	return (info?.bandings ?? [])
		.filter(
			(band) =>
				band.range.startRowIndex === 0 && band.range.startColumnIndex === 0,
		)
		.map((band) => band.bandedRangeId);
}

function planTable({
	definition,
	headers,
	sheetName,
	tab,
}: TableInput): TablePlan {
	const own = ownTableOf(tab.info);
	if (own) {
		return planExistingTable(own, definition, headers);
	}
	if ((tab.info?.tables.length ?? 0) > 0) {
		return { action: "skip" };
	}
	return {
		action: "create",
		name: tableNameFor(sheetName, tab.tableNames),
		rowCount: Math.max(tab.rowCount, MIN_TABLE_ROWS),
		columns: tableColumns(definition, headers, 0),
		removeBandingIds: bandingsAtOrigin(tab.info),
		clearBasicFilter: tab.info?.hasBasicFilter ?? false,
	};
}

function planColumns(
	definition: FormDefinition,
	headers: string[],
	firstNewColumn: number,
): ColumnPlan[] {
	return headers.flatMap((header, index) => {
		const column = findColumnByHeader(definition, header);
		if (!column) {
			return [];
		}
		const isNew = index >= firstNewColumn;
		const format = VALUE_FORMATS[columnCellOf(column).value];
		return [
			{
				index,
				width: isNew ? columnWidthOf(column) : null,
				numberFormat: isNew || format.reapply ? format.numberFormat : null,
			},
		];
	});
}

export function planSheetLayout(
	definition: FormDefinition,
	sheetName: string,
	tab: TabState,
): SheetLayoutPlan {
	const firstNewColumn = tab.headers.length;
	const headers = [...tab.headers, ...missingHeaders(definition, tab.headers)];
	const table = planTable({ definition, headers, sheetName, tab });
	return {
		headers,
		firstNewColumn,
		table,
		// 다른 표가 있는 탭은 열 전체 서식이 그 표에 걸릴 수 있어 건드리지 않는다
		columns:
			table.action === "skip"
				? []
				: planColumns(definition, headers, firstNewColumn),
	};
}

/**
 * 이미 준비된 탭에 다시 걸 서식만 (날짜·시간처럼 값이 일련번호라 서식이 꼭 있어야 하는 열).
 * 쓰기 경로에서 탭마다 한 번 실행한다: 발행 전에 만들어진 탭도 날짜가 숫자로 보이지 않게 한다.
 */
export function planValueFormats(
	definition: FormDefinition,
	info: SheetInfo,
	headers: string[],
): ColumnPlan[] {
	if (!ownTableOf(info) && info.tables.length > 0) {
		return [];
	}
	return planColumns(definition, headers, headers.length).filter(
		(column) => column.numberFormat !== null,
	);
}
