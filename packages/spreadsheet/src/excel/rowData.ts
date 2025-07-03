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
		return docs.map((doc, index) => ({
			ID: index + 1,
			타임스탬프: this.formatTimestamp(doc.createdAt as string),
			이름: String(doc.name || ""),
			또래모임: String(doc.ageGroup || ""),
			연락처: String(doc.phone || ""),
			성별: String(doc.gender || ""),
			부서: String(doc.department || ""),
			"단체티 사이즈": String(doc.tshirtSize || ""),
			"픽업 가능 시간": String(doc.pickupTimeDesc || ""),
			"회비 납입 여부": doc.isPaid ? "예" : "아니오",
			"참석 형태": String(doc.numberOfStays || ""),
			"참석 날짜": this.formatDate(doc.attendanceTime as string),
			"참석 시간": this.formatTime(doc.attendanceTime as string),
			"TF팀 지원": String(doc.tfTeam || "없음"),
			"차량 지원 여부": doc.carSupport ? "예" : "아니오",
			"차량 지원 내용": String(doc.carSupportContent || ""),
		}));
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
