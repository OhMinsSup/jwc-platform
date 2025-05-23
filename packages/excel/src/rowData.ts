import type { RowFormData } from "./types";

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
		const rawData: RowFormData[] = [];
		for (const item of data) {
			rawData.push(this.generateExcelFormRow(item));
		}
		return rawData;
	}
}
