import { z } from "zod";

import type { CellValue, ReadCell, TableTarget } from "./cell-data";
import type { SheetInfo, TableInfo } from "./sheet-info";
import { SheetsApiError } from "./sheets-client";
import type { SheetsClient } from "./sheets-client";
import { sameSheetTitle } from "./spreadsheet-ref";

/**
 * 테스트 지원: 메모리 기반 가짜 Sheets 클라이언트. 운영 코드에서 쓰지 않는다.
 */

const A1_RANGE =
	/^'(?<tab>.+)'!(?<col1>[A-Z]+)?(?<row1>\d+)?(?::(?<col2>[A-Z]+)?(?<row2>\d+)?)?$/u;

/** 명시된 끝 → 단일 셀/열/행이면 시작과 같음 → 없으면 무한 */
function rangeEnd(
	explicit: number | undefined,
	single: number | undefined,
): number {
	return explicit ?? single ?? Number.POSITIVE_INFINITY;
}

const COLUMN_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** "A" → 0, "Z" → 25, "AA" → 26 (26진법, A=1) */
function columnIndex(letters: string): number {
	let index = 0;
	for (const letter of letters) {
		index = index * COLUMN_LETTERS.length + COLUMN_LETTERS.indexOf(letter) + 1;
	}
	return index - 1;
}

function toColumn(letters: string | undefined): number | undefined {
	return letters ? columnIndex(letters) : undefined;
}

function toRow(digits: string | undefined): number | undefined {
	return digits ? Number(digits) - 1 : undefined;
}

/** A1 조각 → 0부터 세는 시작/끝 (끝이 없으면 무한) */
function cellBounds(
	c1: string | undefined,
	r1: string | undefined,
	c2: string | undefined,
	r2: string | undefined,
) {
	const col1 = toColumn(c1);
	const row1 = toRow(r1);
	return {
		col1: col1 ?? 0,
		row1: row1 ?? 0,
		// 열만(C:C) 쓰면 그 열 하나, 행만(1:1) 쓰면 그 행 하나
		col2: rangeEnd(toColumn(c2), r1 ? undefined : col1),
		row2: rangeEnd(toRow(r2), c2 ? undefined : row1),
	};
}

/** 가짜 시트가 알아보는 표 생성 요청 */
const AddTableRequestSchema = z.object({
	addTable: z.object({
		table: z.object({
			name: z.string(),
			range: z.object({
				sheetId: z.number(),
				startRowIndex: z.number().default(0),
				endRowIndex: z.number().optional(),
				startColumnIndex: z.number().default(0),
				endColumnIndex: z.number().optional(),
			}),
			columnProperties: z
				.array(z.looseObject({ columnIndex: z.number().default(0) }))
				.default([]),
		}),
	}),
});

/**
 * 메모리 기반 가짜 시트. A1 표기 중 이 앱이 쓰는 형태만 지원한다:
 * '탭'!1:1, '탭'!C:C, '탭'!A:ZZ, '탭'!A5:F5, '탭'!D7
 */
export class FakeSheets implements SheetsClient {
	readonly tabs = new Map<string, ReadCell[][]>();
	readonly batchRequests: unknown[] = [];
	/** 탭별 메타데이터 덮어쓰기 (기존 줄무늬/필터/표가 있는 탭을 흉내 낸다) */
	readonly meta = new Map<string, Partial<SheetInfo>>();

	private parse(range: string) {
		const groups = A1_RANGE.exec(range)?.groups;
		if (!groups) {
			throw new Error(`지원하지 않는 범위: ${range}`);
		}
		const { tab = "", col1, row1, col2, row2 } = groups;
		// 실제 API와 동일하게 탭 이름의 대소문자는 구분하지 않는다
		const title = tab.replaceAll("''", "'");
		const key = [...this.tabs.keys()].find((name) =>
			sameSheetTitle(name, title),
		);
		const grid = key === undefined ? undefined : this.tabs.get(key);
		if (!grid) {
			// 실제 API와 동일하게: 없는 탭 범위는 400 "Unable to parse range"
			throw new SheetsApiError(400, `Unable to parse range: ${tab}`);
		}
		return { grid, ...cellBounds(col1, row1, col2, row2) };
	}

	listSheets() {
		return Promise.resolve(
			[...this.tabs.keys()].map((title, sheetId): SheetInfo => ({
				title,
				sheetId,
				bandings: [],
				hasBasicFilter: false,
				tables: [],
				...this.meta.get(title),
			})),
		);
	}
	addSheet(title: string) {
		this.tabs.set(title, []);
		return Promise.resolve(this.tabs.size - 1);
	}
	getValues(range: string) {
		const { grid, col1, row1, col2, row2 } = this.parse(range);
		const rows = grid.slice(
			row1,
			row2 === Number.POSITIVE_INFINITY ? undefined : row2 + 1,
		);
		return Promise.resolve(
			rows.map((row) =>
				row.slice(
					col1,
					col2 === Number.POSITIVE_INFINITY ? undefined : col2 + 1,
				),
			),
		);
	}
	updateValues(range: string, rows: CellValue[][]) {
		const { grid, col1, row1 } = this.parse(range);
		for (const [r, cells] of rows.entries()) {
			const target = grid[row1 + r] ?? [];
			for (const [c, cell] of cells.entries()) {
				if (cell !== null) {
					target[col1 + c] = cell;
				}
			}
			grid[row1 + r] = Array.from(target, (cell) => cell ?? "");
		}
		return Promise.resolve();
	}
	appendValues(range: string, rows: CellValue[][]) {
		const { grid } = this.parse(range);
		for (const row of rows) {
			grid.push(row.map((cell) => cell ?? ""));
		}
		return Promise.resolve();
	}
	appendTableRows({ sheetId, tableId }: TableTarget, rows: CellValue[][]) {
		// 실제 API처럼 sheetId가 가리키는 탭에 붙인다. 그 탭의 표가 아니면 거절해 잘못된 탭을 드러낸다
		const title = [...this.tabs.keys()][sheetId];
		const owns =
			title !== undefined &&
			(this.meta.get(title)?.tables ?? []).some(
				(table) => table.tableId === tableId,
			);
		const grid = owns ? this.tabs.get(title) : undefined;
		if (!grid) {
			throw new SheetsApiError(
				400,
				`Table ${tableId} is not on sheet ${String(sheetId)}`,
			);
		}
		// 실제 API처럼 표 본문의 빈 행(ID 칸이 빈 행)부터 채운다
		for (const row of rows) {
			const cells = row.map((cell) => cell ?? "");
			const free = grid.findIndex(
				(existing, index) => index > 0 && existing.every((cell) => cell === ""),
			);
			if (free === -1) {
				grid.push(cells);
			} else {
				grid[free] = cells;
			}
		}
		return Promise.resolve();
	}
	batchUpdate(requests: unknown[]) {
		this.batchRequests.push(...requests);
		for (const request of requests) {
			this.recordTable(request);
		}
		return Promise.resolve();
	}
	/** addTable 요청을 메타데이터에 남긴다 (다음 listSheets와 appendTableRows가 본다) */
	private recordTable(request: unknown) {
		const parsed = AddTableRequestSchema.safeParse(request);
		if (!parsed.success) {
			return;
		}
		const { table } = parsed.data.addTable;
		const title = [...this.tabs.keys()][table.range.sheetId];
		if (title === undefined) {
			return;
		}
		const meta = this.meta.get(title) ?? {};
		const added: TableInfo = {
			...table,
			tableId: `table-${this.batchRequests.length}`,
		};
		meta.tables = [...(meta.tables ?? []), added];
		this.meta.set(title, meta);
	}
}
