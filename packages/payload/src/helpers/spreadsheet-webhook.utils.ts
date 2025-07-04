import { env } from "@jwc/payload/env";
import { DataConverter } from "@jwc/spreadsheet";
import {
	parseAttendanceTime,
	parseName,
	parseTshirtSizeText,
} from "@jwc/utils/format";
import { APIError } from "payload";

/**
 * 웹훅 데이터 타입
 */
export interface WebhookBody {
	eventType: string;
	spreadsheetId: string;
	sheetName: string;
	range: string;
	row: number;
	column: number;
	header: string;
	id: string;
	oldValue: unknown;
	newValue: unknown;
	timestamp: string;
	[key: string]: unknown;
}

/**
 * 키에 따른 값 파싱 함수
 */
export function parseValueByKey(key: string, value: unknown): unknown {
	switch (key) {
		case "tshirtSize": {
			return parseTshirtSizeText(value as string);
		}
		case "attendanceTime": {
			return parseAttendanceTime(value as string);
		}
		case "carSupport": {
			return value === "지원";
		}
		case "isPaid": {
			return value === "납입";
		}
		case "name": {
			return parseName(value as string);
		}
		default: {
			return value;
		}
	}
}

/**
 * 웹훅 데이터 검증
 */
export function validateWebhookData(data: WebhookBody): void {
	if (data.sheetName !== env.GOOGLE_SHEET_TITLE) {
		throw new APIError(
			"Invalid sheet name",
			400,
			{
				name: "validateWebhookData",
				action: "validation",
				error: "Invalid sheet name",
			},
			true
		);
	}

	if (data.spreadsheetId !== env.GOOGLE_SHEET_ID) {
		throw new APIError(
			"Invalid spreadsheet ID",
			400,
			{
				name: "validateWebhookData",
				action: "validation",
				error: "Invalid spreadsheet ID",
			},
			true
		);
	}

	if (!data.id) {
		throw new APIError(
			"ID is required",
			404,
			{
				name: "validateWebhookData",
				action: "validation",
				error: "ID is required",
			},
			true
		);
	}
}

/**
 * 헤더 검증 및 키 반환
 */
export function validateAndGetHeaderKey(header: string): string {
	const spreadsheetHeaders = DataConverter.getSpreadsheetHeaders();
	const headerObj = spreadsheetHeaders.find((h) => h.displayName === header);

	if (!headerObj) {
		throw new APIError(
			`Header "${header}" not found in the spreadsheet headers`,
			404,
			{
				name: "validateAndGetHeaderKey",
				action: "validation",
				error: `Header "${header}" not found in the spreadsheet headers`,
			},
			true
		);
	}

	const { key } = headerObj;
	if (!key) {
		throw new APIError(
			`Header "${header}" does not have a valid key`,
			404,
			{
				name: "validateAndGetHeaderKey",
				action: "validation",
				error: `Header "${header}" does not have a valid key`,
			},
			true
		);
	}

	if (key === "id") {
		throw new APIError(
			'Cannot sync "id" header',
			400,
			{
				name: "validateAndGetHeaderKey",
				action: "validation",
				error: 'Cannot sync "id" header',
			},
			true
		);
	}

	return key;
}

/**
 * 스프레드시트 웹훅 처리를 위한 네임스페이스
 */
export namespace SpreadsheetWebhookUtils {
	/**
	 * 웹훅 데이터를 처리하고 파싱된 값을 반환
	 */
	export function processWebhookData(data: WebhookBody): {
		key: string;
		parsedValue: unknown;
	} {
		validateWebhookData(data);
		const key = validateAndGetHeaderKey(data.header);
		const parsedValue = parseValueByKey(key, data.newValue);

		return { key, parsedValue };
	}
}
