type ExcelHeader = {
	name: string;
	key?: string;
	width: number;
	hidden?: boolean;
};

type ExcelHeaders = ExcelHeader[];

export class ExcelHead {
	// _headers 배열에 저장된 픽셀 단위 너비를 Excel의 너비 기준으로 변환
	private _pixelToExcelWidth(pxWidth: number): number {
		// Calibri 11pt 기준으로 1 열 너비는 대략 7 픽셀에 해당
		// 이는 근사치이며, 정확한 비율은 사용 환경에 따라 다를 수 있음
		const approximateRatio = 7;
		return pxWidth / approximateRatio;
	}

	// ExcelHeader 객체를 Excel에 적합한 형태로 변환
	private _formatter(header: ExcelHeader): ExcelHeader {
		return {
			name: header.name,
			width: this._pixelToExcelWidth(header.width),
		};
	}

	// 신청서 시트의 헤더를 생성
	createFormSheetHeaders() {
		const headers: ExcelHeaders = [
			{
				name: "순서",
				width: 50,
			},
			{
				name: "타임스탬프",
				key: "timestamp",
				width: 140,
			},
			{
				name: "이름",
				key: "name",
				width: 200,
			},
			{
				name: "연락처",
				key: "phone",
				width: 80,
			},
			{
				name: "또래모임",
				key: "ageGroup",
				width: 70,
			},
			{
				name: "성별",
				key: "gender",
				width: 40,
			},
			{
				name: "부서",
				key: "department",
				width: 55,
			},
			{
				name: "픽업 가능 시간",
				key: "pickupTimeDesc",
				width: 200,
			},
			{
				name: "참석 형태",
				key: "numberOfStays",
				width: 70,
			},
			{
				name: "TF팀 지원",
				key: "tfTeam",
				width: 80,
			},
			{
				name: "단체티 사이즈",
				key: "tshirtSize",
				width: 80,
				hidden: true,
			},
			{
				name: "차량 지원 여부",
				key: "carSupport",
				width: 100,
			},
			{
				name: "차량 지원 내용",
				key: "carSupportContent",
				width: 200,
			},
			{
				name: "회비 납입 여부",
				key: "isPaid",
				width: 100,
			},
		];

		return headers
			.filter((header) => !header.hidden)
			.map((header) => this._formatter(header));
	}
}
