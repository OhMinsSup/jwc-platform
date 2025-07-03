import { dayjs, getDateFormat } from "@jwc/utils/date";
import type { RowFormData } from "../core/types";
/**
 * 데이터 변환 유틸리티
 * 다양한 형식의 데이터를 스프레드시트 형식으로 변환하는 기능을 제공합니다.
 */
export namespace DataConverter {
	/**
	 * ID 값을 안전하게 변환합니다.
	 * @param value - 변환할 값
	 * @param fallback - 기본값
	 * @returns string | number 형식의 ID
	 */
	function formatId(
		value: unknown,
		fallback: string | number = 0
	): string | number {
		if (typeof value === "string" || typeof value === "number") {
			return value;
		}
		return fallback;
	}

	/**
	 * 임의의 객체를 RowFormData 형식으로 변환합니다.
	 * @param data - 변환할 데이터
	 * @returns RowFormData 형식의 데이터
	 */
	export function toRowFormData<T extends Record<string, unknown>>(
		data: T
	): RowFormData {
		return {
			ID: formatId(data.id || data.ID, 0),
			타임스탬프: formatValue(
				data.createdAt || data.timestamp || new Date().toISOString()
			),
			이름: formatValue(data.name || data.이름 || ""),
			또래모임: formatValue(data.ageGroup || data.또래모임 || ""),
			연락처: formatValue(data.phone || data.연락처 || ""),
			성별: formatValue(data.gender || data.성별 || ""),
			부서: formatValue(data.department || data.부서 || ""),
			"단체티 사이즈": formatValue(data.tshirtSize || data["단체티 사이즈"]),
			"픽업 가능 시간": formatValue(
				data.pickupTimeDesc || data["픽업 가능 시간"] || ""
			),
			"회비 납입 여부": formatBoolean(data.isPaid || data["회비 납입 여부"]),
			"참석 형태": formatValue(data.numberOfStays || data["참석 형태"] || ""),
			"참석 날짜": formatDateTime(data.attendanceTime || data["참석 날짜"]),
			"TF팀 지원": formatValue(data.tfTeam || data["TF팀 지원"] || "없음"),
			"차량 지원 여부": formatBoolean(
				data.carSupport || data["차량 지원 여부"]
			),
			"차량 지원 내용": formatValue(
				data.carSupportContent || data["차량 지원 내용"] || ""
			),
		};
	}

	/**
	 * 배열 데이터를 RowFormData 배열로 변환합니다.
	 * @param dataArray - 변환할 데이터 배열
	 * @returns RowFormData 배열
	 */
	export function toRowFormDataArray<T extends Record<string, unknown>>(
		dataArray: T[]
	): RowFormData[] {
		return dataArray.map((data, index) => ({
			...toRowFormData(data),
			ID: formatId(data.id || data.ID, index + 1),
		}));
	}

	/**
	 * 값을 문자열로 포맷합니다.
	 * @param value - 포맷할 값
	 * @returns 포맷된 문자열
	 */
	function formatValue(value: unknown): string {
		if (value == null) return "";
		if (typeof value === "string") return value;
		if (typeof value === "number") return value.toString();
		if (typeof value === "boolean") return value ? "예" : "아니오";
		if (value instanceof Date) return value.toISOString();
		return String(value);
	}

	/**
	 * 불린 값을 "예"/"아니오"로 포맷합니다.
	 * @param value - 포맷할 불린 값
	 * @returns "예" 또는 "아니오"
	 */
	function formatBoolean(value: unknown): string {
		if (typeof value === "boolean") return value ? "예" : "아니오";
		if (typeof value === "string") {
			const lowerValue = value.toLowerCase();
			return lowerValue === "true" ||
				lowerValue === "예" ||
				lowerValue === "yes"
				? "예"
				: "아니오";
		}
		return "아니오";
	}

	/**
	 * 날짜를 포맷합니다.
	 * @param value - 포맷할 날짜 값
	 * @returns 포맷된 날짜 문자열
	 */
	function formatDate(value: unknown): string {
		if (!value) return "";

		try {
			return getDateFormat(value as string);
		} catch (e) {
			console.error("Error formatting date:", e);
			return String(value);
		}
	}

	function formatDateTime(value: unknown): string {
		const date = dayjs(value as string);
		if (!date.isValid()) return String(value);

		// MM/dd/yyyy HH:mm
		const formattedDate = date.tz("Asia/Seoul").format("DD/MM/YYYY");
		const formattedTime = date.tz("Asia/Seoul").format("HH:mm");
		return `${formattedDate} ${formattedTime}`;
	}

	/**
	 * 시간을 포맷합니다.
	 * @param value - 포맷할 시간 값
	 * @returns 포맷된 시간 문자열
	 */
	function formatTime(value: unknown): string {
		if (!value) return "";

		try {
			const date = new Date(value as string);
			if (Number.isNaN(date.getTime())) return String(value);

			return date.toLocaleTimeString("ko-KR", {
				hour: "2-digit",
				minute: "2-digit",
			});
		} catch {
			return String(value);
		}
	}

	/**
	 * 스프레드시트 헤더 정보를 반환합니다.
	 * @returns 스프레드시트 헤더 배열
	 */
	export function getSpreadsheetHeaders(): Array<{
		key: string;
		displayName: string;
	}> {
		return [
			{ key: "ID", displayName: "ID" },
			{ key: "createdAt", displayName: "타임스탬프" },
			{ key: "name", displayName: "이름" },
			{ key: "ageGroup", displayName: "또래모임" },
			{ key: "phone", displayName: "연락처" },
			{ key: "gender", displayName: "성별" },
			{ key: "department", displayName: "부서" },
			{ key: "tshirtSize", displayName: "단체티 사이즈" },
			{ key: "pickupTimeDesc", displayName: "픽업 가능 시간" },
			{ key: "isPaid", displayName: "회비 납입 여부" },
			{ key: "numberOfStays", displayName: "참석 형태" },
			{ key: "attendanceTime", displayName: "참석 날짜" },
			{ key: "tfTeam", displayName: "TF팀 지원" },
			{ key: "carSupport", displayName: "차량 지원" },
			{ key: "note", displayName: "기타 내용" },
		];
	}
}
