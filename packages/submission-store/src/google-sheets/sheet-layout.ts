import type { FormDefinition } from "@jwc/form-core/definition/definition";
import { columnLetter, quoteSheetName } from "@jwc/google/sheets-client";
import type { SheetsClient } from "@jwc/google/sheets-client";
import { sameSheetTitle } from "@jwc/google/spreadsheet-ref";

import { planSheetLayout } from "./layout-plan";
import { layoutRequests } from "./layout-requests";

/**
 * 응답 탭 준비의 I/O 경계: 탭 상태 읽기 → 계획(layout-plan.ts) → 탭/헤더 쓰기 + 표·서식 요청(layout-requests.ts).
 * 발행할 때마다 다시 실행해도 안전하다 (계획이 운영자 수정을 덮지 않는다).
 */

const HEADER_ROW = "1:1";
const ALL_COLUMNS = "A:ZZ";

export function a1(sheetName: string, ref: string): string {
	return `${quoteSheetName(sheetName)}!${ref}`;
}

export async function readHeaders(
	client: SheetsClient,
	sheetName: string,
): Promise<string[]> {
	const [headers = []] = await client.getValues(a1(sheetName, HEADER_ROW));
	return headers.map((header) => String(header).trim());
}

/** 탭이 없으면 만들고, 빠진 헤더를 오른쪽에 더한 뒤 표와 서식을 건다. 준비 후의 헤더를 돌려준다 */
export async function ensureSheetLayout(
	client: SheetsClient,
	sheetName: string,
	definition: FormDefinition,
): Promise<string[]> {
	const tabs = await client.listSheets();
	const info = tabs.find((sheet) => sameSheetTitle(sheet.title, sheetName));
	// 표 범위를 기존 응답까지 덮어야 하므로 행 수도 함께 읽는다 (발행 시에만 실행)
	const rows = info ? await client.getValues(a1(sheetName, ALL_COLUMNS)) : [];
	const headers = (rows[0] ?? []).map((header) => String(header).trim());
	const plan = planSheetLayout(definition, sheetName, {
		info,
		headers,
		rowCount: Math.max(rows.length, 1),
		tableNames: new Set(
			tabs.flatMap((sheet) => sheet.tables.map((table) => table.name)),
		),
	});
	const sheetId = info?.sheetId ?? (await client.addSheet(sheetName));
	if (plan.headers.length > headers.length) {
		await client.updateValues(
			a1(sheetName, `A1:${columnLetter(plan.headers.length)}1`),
			[plan.headers],
		);
	}
	await client.batchUpdate(layoutRequests(sheetId, plan));
	return plan.headers;
}
