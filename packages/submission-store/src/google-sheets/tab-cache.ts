import type { FormDefinition } from "@jwc/form-core/definition/definition";
import type { SheetsClient } from "@jwc/google/sheets-client";
import { sameSheetTitle, sheetTitleKey } from "@jwc/google/spreadsheet-ref";

import { ownTableOf, planValueFormats } from "./layout-plan";
import { columnRequests } from "./layout-requests";

/**
 * 탭 정보 캐시 (저장소 인스턴스 = 프로세스 수명 동안). 쓰기마다 탭 메타데이터를 다시 읽지 않게 한다.
 * - 탭마다 처음 쓸 때 한 번: sheetId·응답 표 ID를 읽고, 날짜·시간 열 서식을 다시 건다
 *   (발행 전에 만들어진 탭에서도 일련번호가 숫자로 보이지 않게).
 * - 탭을 다시 준비했거나(발행) 표 쓰기가 400으로 거절되면 forget으로 버리고 다음 쓰기에서 다시 읽는다.
 */

interface TabHandle {
	sheetId: number;
	/** 응답 표(A1에서 시작하는 시트 "표") ID. 표가 없는 탭이면 null */
	tableId: string | null;
}

export interface TabCache {
	/** 탭이 없으면 null (캐시하지 않는다) */
	handle: (
		sheetName: string,
		definition: FormDefinition,
		headers: string[],
	) => Promise<TabHandle | null>;
	forget: (sheetName: string) => void;
}

async function resolveHandle(
	client: SheetsClient,
	sheetName: string,
	definition: FormDefinition,
	headers: string[],
): Promise<TabHandle | null> {
	const tabs = await client.listSheets();
	const info = tabs.find((sheet) => sameSheetTitle(sheet.title, sheetName));
	if (!info) {
		return null;
	}
	const formats = planValueFormats(definition, info, headers).flatMap(
		(column) => columnRequests(info.sheetId, column),
	);
	if (formats.length > 0) {
		await client.batchUpdate(formats);
	}
	return { sheetId: info.sheetId, tableId: ownTableOf(info)?.tableId ?? null };
}

export function createTabCache(client: SheetsClient): TabCache {
	// 읽기에 성공한 탭만 남긴다 (탭이 없거나 실패하면 다음 쓰기에서 다시 읽는다).
	// 처음 쓰기가 동시에 몰리면 각자 한 번씩 읽을 수 있지만, 서식 요청은 같은 결과라 문제없다
	const handles = new Map<string, TabHandle>();
	return {
		forget: (sheetName) => {
			handles.delete(sheetTitleKey(sheetName));
		},
		handle: async (sheetName, definition, headers) => {
			const key = sheetTitleKey(sheetName);
			const cached = handles.get(key);
			if (cached) {
				return cached;
			}
			const resolved = await resolveHandle(
				client,
				sheetName,
				definition,
				headers,
			);
			if (resolved) {
				handles.set(key, resolved);
			}
			return resolved;
		},
	};
}
