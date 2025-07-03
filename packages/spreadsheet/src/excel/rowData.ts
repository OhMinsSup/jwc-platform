import type { RowFormData } from "../core/types";

/**
 * Excel 행 데이터 관리 클래스
 * Form 데이터를 Excel 형식으로 변환하는 기능을 제공합니다.
 */
export class ExcelRowDataManager {
	/**
	 * Form 데이터를 Excel 행 데이터로 변환합니다.
	 * @param docs - 변환할 Form 데이터 배열
	 * @returns Excel 행 데이터 배열
	 */
	generateExcelFormRows<T extends Record<string, unknown>>(
		docs: T[]
	): RowFormData[] {
		return docs;
	}

	/**
	 * 타임스탬프를 포맷합니다.
	 * @param timestamp - 포맷할 타임스탬프
	 * @returns 포맷된 타임스탬프 문자열
	 */
	private formatTimestamp(timestamp: string): string {
		if (!timestamp) return "";

		try {
			const date = new Date(timestamp);
			return date.toLocaleString("ko-KR", {
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit",
			});
		} catch {
			return timestamp;
		}
	}

	/**
	 * 날짜를 포맷합니다.
	 * @param dateTime - 포맷할 날짜시간
	 * @returns 포맷된 날짜 문자열
	 */
	private formatDate(dateTime: string): string {
		if (!dateTime) return "";

		try {
			const date = new Date(dateTime);
			return date.toLocaleDateString("ko-KR", {
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
			});
		} catch {
			return dateTime;
		}
	}

	/**
	 * 시간을 포맷합니다.
	 * @param dateTime - 포맷할 날짜시간
	 * @returns 포맷된 시간 문자열
	 */
	private formatTime(dateTime: string): string {
		if (!dateTime) return "";

		try {
			const date = new Date(dateTime);
			return date.toLocaleTimeString("ko-KR", {
				hour: "2-digit",
				minute: "2-digit",
			});
		} catch {
			return dateTime;
		}
	}
}
