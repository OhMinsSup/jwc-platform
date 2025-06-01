import type { RowFormData } from "./types";

function formatAttendanceDay(value: unknown) {
	switch (value) {
		case "19":
			return "6월 19일";
		case "20":
			return "6월 20일";
		case "21":
			return "6월 21일";
		case "22":
			return "6월 22일";
		default:
			return value || "";
	}
}

function formatAttendanceTime(value: unknown) {
	switch (value) {
		case "AM":
			return "오전";
		case "PM":
			return "오후";
		case "EVENING":
			return "저녁";
		default:
			return value || "";
	}
}

export class ExcelRowData<
	Data extends Record<string, unknown> = Record<string, unknown>,
> {
	// 신청서 시트의 행을 생성
	generateExcelFormRow(doc: Data) {
		return {
			타임스탬프:
				typeof doc.createdAt === "string" || typeof doc.createdAt === "number"
					? new Date(doc.createdAt).toLocaleString("ko-KR", {
							timeZone: "Asia/Seoul",
						})
					: "",
			이름: doc.name || "",
			또래모임: doc.ageGroup || "",
			연락처: doc.phone || "",
			성별: doc.gender,
			부서: doc.department,
			...(doc.tshirtSize ? { "단체티 사이즈": doc.tshirtSize } : {}),
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

	// 배열형태로 된 신청서 데이터를 엑셀 형태로 변환
	generateExcelFormRows(data: Data[]) {
		// const rawData: RowFormData[] = [];
		// for (const item of data) {
		// 	rawData.push(this.generateExcelFormRow(item));
		// }
		// return rawData;
		const seen = new Set<string>();
		const rawData: RowFormData[] = [];
		for (const item of data) {
			const id = (item as Record<string, unknown>).id as string | undefined;
			if (!id || !seen.has(id)) {
				rawData.push(this.generateExcelFormRow(item));
				if (id) seen.add(id);
			}
		}
		return rawData;
	}
}
