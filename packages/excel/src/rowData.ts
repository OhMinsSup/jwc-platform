import {
	formatAttendanceDay,
	formatAttendanceTime,
	formatName,
	formatTshirtSizeText,
} from "@jwc/utils/format";
import type { RowFormData } from "./types";

/**
 * Excel 행 데이터 유틸리티 클래스
 *
 * 신청서 데이터를 Excel/Google Sheets에 맞는 행 데이터로 변환하는 기능을 제공합니다.
 */
export class ExcelRowData<
	Data extends Record<string, unknown> = Record<string, unknown>,
> {
	/**
	 * 단일 신청서 객체를 Excel 행 데이터로 변환합니다.
	 *
	 * @param doc - 신청서 데이터 객체
	 * @returns 변환된 Excel 행 데이터(RowFormData)
	 */
	generateExcelFormRow(doc: Data, index: number): RowFormData {
		return {
			...(index !== undefined ? { 순서: index } : {}),
			이름: formatName(doc),
			또래모임: doc.ageGroup || "",
			연락처: doc.phone || "",
			성별: doc.gender,
			부서: doc.department,
			"단체티 사이즈": formatTshirtSizeText(doc.tshirtSize),
			"참석 날짜": formatAttendanceDay(doc.attendanceDay),
			"참석 시간": formatAttendanceTime(doc.attendanceTime),
			"픽업 가능 시간": doc.pickupTimeDesc ?? "",
			"회비 납입 여부": doc.isPaid ? "납입" : "미납",
			"참석 형태": doc.numberOfStays,
			"TF팀 지원": doc.tfTeam ?? "",
			"차량 지원 여부": doc.carSupport ? "지원" : "미지원",
			"차량 지원 내용": doc.carSupportContent ?? "",
		} as RowFormData;
	}

	/**
	 * 신청서 데이터 배열을 Excel 행 데이터 배열로 변환합니다.
	 * id 필드를 기준으로 중복을 제거합니다.
	 *
	 * @param data - 신청서 데이터 객체 배열
	 * @returns 중복이 제거된 Excel 행 데이터 배열
	 */
	generateExcelFormRows(data: Data[]): RowFormData[] {
		const seen = new Set<string>();
		const rawData: RowFormData[] = [];
		for (const item of data) {
			const id = (item as Record<string, unknown>).id as string | undefined;
			if (!id || !seen.has(id)) {
				const index = rawData.length + 1; // 순서
				rawData.push(this.generateExcelFormRow(item, index));
				if (id) seen.add(id);
			}
		}
		return rawData;
	}
}
