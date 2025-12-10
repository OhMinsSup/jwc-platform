/**
 * @fileoverview 데이터 변환기 구현
 *
 * 스키마 기반으로 데이터를 변환하는 유틸리티를 제공합니다.
 * 다양한 데이터 타입에 대응하는 포맷터를 포함합니다.
 */

import { dayjs } from "@jwc/utils/date";
import type {
	ColumnType,
	IColumnDefinition,
	IDataTransformer,
	ISpreadsheetSchema,
	IValueFormatter,
} from "./interfaces";

/**
 * 기본 값 포맷터
 * 다양한 타입의 값을 문자열로 변환합니다.
 */
export class DefaultValueFormatter implements IValueFormatter {
	format(value: unknown, type?: ColumnType): string {
		if (value === undefined || value === null) {
			return "";
		}

		switch (type) {
			case "boolean":
				return this.formatBoolean(value);
			case "date":
				return this.formatDate(value);
			case "datetime":
				return this.formatDateTime(value);
			case "time":
				return this.formatTime(value);
			case "number":
			case "currency":
			case "percent":
				return this.formatNumber(value, type);
			default:
				return this.formatText(value);
		}
	}

	private formatBoolean(value: unknown): string {
		if (typeof value === "boolean") {
			return value ? "예" : "아니오";
		}
		if (typeof value === "string") {
			const lower = value.toLowerCase();
			return lower === "true" || lower === "예" || lower === "yes"
				? "예"
				: "아니오";
		}
		return "아니오";
	}

	private formatDate(value: unknown): string {
		if (!value) {
			return "";
		}
		try {
			const date = dayjs(value as string);
			return date.isValid() ? date.format("YYYY-MM-DD") : String(value);
		} catch {
			return String(value);
		}
	}

	private formatDateTime(value: unknown): string {
		if (!value) {
			return "";
		}
		try {
			const date = dayjs(value as string);
			if (!date.isValid()) {
				return String(value);
			}
			return date.tz("Asia/Seoul").format("YYYY-MM-DD HH:mm");
		} catch {
			return String(value);
		}
	}

	private formatTime(value: unknown): string {
		if (!value) {
			return "";
		}
		try {
			const date = dayjs(value as string);
			return date.isValid() ? date.format("HH:mm") : String(value);
		} catch {
			return String(value);
		}
	}

	private formatNumber(
		value: unknown,
		type: "number" | "currency" | "percent"
	): string {
		const num = typeof value === "number" ? value : Number(value);
		if (Number.isNaN(num)) {
			return String(value);
		}

		switch (type) {
			case "currency":
				return new Intl.NumberFormat("ko-KR", {
					style: "currency",
					currency: "KRW",
				}).format(num);
			case "percent":
				return new Intl.NumberFormat("ko-KR", {
					style: "percent",
					minimumFractionDigits: 0,
				}).format(num);
			default:
				return new Intl.NumberFormat("ko-KR").format(num);
		}
	}

	private formatText(value: unknown): string {
		if (typeof value === "string") {
			return value;
		}
		if (typeof value === "number") {
			return String(value);
		}
		if (typeof value === "boolean") {
			return value ? "예" : "아니오";
		}
		if (value instanceof Date) {
			return this.formatDateTime(value);
		}
		if (Array.isArray(value)) {
			return value.join(", ");
		}
		return String(value);
	}
}

/**
 * 스키마 기반 데이터 변환기
 * 스키마 정의에 따라 데이터를 행 형식으로 변환합니다.
 */
export class SchemaBasedTransformer<T = Record<string, unknown>>
	implements IDataTransformer<T, Record<string, string>>
{
	private readonly schema: ISpreadsheetSchema<T>;
	private readonly formatter: IValueFormatter;

	constructor(
		schema: ISpreadsheetSchema<T>,
		formatter: IValueFormatter = new DefaultValueFormatter()
	) {
		this.schema = schema;
		this.formatter = formatter;
	}

	/**
	 * 단일 데이터 객체를 스프레드시트 행 형식으로 변환
	 */
	transform(data: T, index?: number): Record<string, string> {
		const result: Record<string, string> = {};

		for (const column of this.schema.columns) {
			const rawValue = this.extractValue(data, column.key as string);
			result[column.header] = this.formatValue(rawValue, column, data);
		}

		// 인덱스가 있으면 순번 추가
		if (index !== undefined && !result.순번) {
			result.순번 = String(index + 1);
		}

		return result;
	}

	/**
	 * 데이터 배열을 스프레드시트 행 형식 배열로 변환
	 */
	transformMany(dataArray: T[]): Record<string, string>[] {
		return dataArray.map((data, index) => this.transform(data, index));
	}

	/**
	 * 헤더 배열 반환
	 */
	getHeaders(): string[] {
		return this.schema.columns.map((col) => col.header);
	}

	/**
	 * 데이터를 2차원 배열로 변환 (Google Sheets용)
	 */
	toRows(dataArray: T[]): string[][] {
		return dataArray.map((data, index) => {
			const transformed = this.transform(data, index);
			return this.schema.columns.map((col) => transformed[col.header] || "");
		});
	}

	/**
	 * 데이터에서 값 추출 (중첩 키 지원)
	 */
	private extractValue(data: T, key: string): unknown {
		if (key.includes(".")) {
			// 중첩 키 처리 (예: "user.name")
			const keys = key.split(".");
			let value: unknown = data;
			for (const k of keys) {
				if (value === null || value === undefined) {
					return;
				}
				value = (value as Record<string, unknown>)[k];
			}
			return value;
		}
		return (data as Record<string, unknown>)[key];
	}

	/**
	 * 컬럼 정의에 따라 값 포맷
	 */
	private formatValue(
		value: unknown,
		column: IColumnDefinition<T>,
		row: T
	): string {
		// 커스텀 포맷터가 있으면 사용
		if (column.formatter) {
			return column.formatter(value, row);
		}

		// 드롭다운 타입이면 옵션 검증
		if (column.type === "dropdown" && column.options) {
			const strValue = String(value || "");
			return column.options.includes(strValue) ? strValue : "";
		}

		// 기본 포맷터 사용
		return this.formatter.format(value, column.type);
	}
}

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * 객체에서 값을 안전하게 추출
 */
export function getValue<T>(
	obj: T,
	key: keyof T | string,
	defaultValue = ""
): unknown {
	if (typeof key === "string" && key.includes(".")) {
		const keys = key.split(".");
		let value: unknown = obj;
		for (const k of keys) {
			if (value === null || value === undefined) {
				return defaultValue;
			}
			value = (value as Record<string, unknown>)[k];
		}
		return value ?? defaultValue;
	}
	return (obj as Record<string, unknown>)[key as string] ?? defaultValue;
}

/**
 * 빈 값 체크
 */
export function isEmpty<T>(data: T[] | undefined | null): boolean {
	return !data || data.length === 0;
}

/**
 * 중복 제거
 */
export function removeDuplicates<T>(
	data: T[],
	keyFn: (item: T) => string | number = (item) => JSON.stringify(item)
): T[] {
	const seen = new Set<string | number>();
	return data.filter((item) => {
		const key = keyFn(item);
		if (seen.has(key)) {
			return false;
		}
		seen.add(key);
		return true;
	});
}

/**
 * 안전한 JSON 파싱
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
	try {
		return JSON.parse(json) as T;
	} catch {
		return defaultValue;
	}
}
