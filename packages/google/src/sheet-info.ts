import { z } from "zod";

/**
 * 탭 메타데이터 (spreadsheets.get의 fields로 필요한 것만 읽는다).
 * 응답 탭을 준비할 때 기존 표·줄무늬·필터와 부딪히지 않게 확인하는 데 쓴다.
 */

/** 응답에서 0인 인덱스는 생략된다 → 0으로 채운다. 끝 인덱스는 없으면 열린 범위 */
const GridRangeSchema = z.object({
	startRowIndex: z.number().default(0),
	endRowIndex: z.number().optional(),
	startColumnIndex: z.number().default(0),
	endColumnIndex: z.number().optional(),
});

export type GridSpan = z.infer<typeof GridRangeSchema>;

/** 표 열 속성. 운영자가 정한 값을 그대로 돌려보내야 하므로(열 추가 시 배열 전체 교체) 원래 모양을 보존한다 */
const TableColumnSchema = z.looseObject({
	columnIndex: z.number().default(0),
	columnName: z.string().optional(),
	columnType: z.string().optional(),
});

export type TableColumnProperties = z.infer<typeof TableColumnSchema>;

const TableSchema = z.object({
	tableId: z.string(),
	name: z.string(),
	range: GridRangeSchema,
	columnProperties: z.array(TableColumnSchema).default([]),
});

export type TableInfo = z.infer<typeof TableSchema>;

export const SheetsResponseSchema = z.object({
	sheets: z
		.array(
			z.object({
				properties: z.object({ title: z.string(), sheetId: z.number() }),
				bandedRanges: z
					.array(
						z.object({
							bandedRangeId: z.number(),
							range: GridRangeSchema.default({
								startRowIndex: 0,
								startColumnIndex: 0,
							}),
						}),
					)
					.optional(),
				basicFilter: z.unknown().optional(),
				tables: z.array(TableSchema).optional(),
			}),
		)
		.optional(),
});

export const SHEETS_FIELDS =
	"sheets(properties(title,sheetId),bandedRanges(bandedRangeId,range),basicFilter.range,tables(tableId,name,range,columnProperties))";

export interface SheetInfo {
	/** 줄무늬(교차 색상) 범위들 */
	bandings: { bandedRangeId: number; range: GridSpan }[];
	hasBasicFilter: boolean;
	sheetId: number;
	/** 시트 "표"들 */
	tables: TableInfo[];
	title: string;
}

export function toSheetInfos(
	body: z.infer<typeof SheetsResponseSchema>,
): SheetInfo[] {
	return (body.sheets ?? []).map((sheet) => ({
		...sheet.properties,
		bandings: sheet.bandedRanges ?? [],
		hasBasicFilter: sheet.basicFilter !== undefined,
		tables: sheet.tables ?? [],
	}));
}
