import type { FormDefinitionInput } from "../definition/definition";

const AGE_GROUP_FIRST = 86;
const AGE_GROUP_LAST_NEXT_CENTURY = 8;

/** 86또래 ~ 08또래 */
function ageGroupOptions() {
	const years: number[] = [];
	for (let year = AGE_GROUP_FIRST; year <= 99; year += 1) {
		years.push(year);
	}
	for (let year = 0; year <= AGE_GROUP_LAST_NEXT_CENTURY; year += 1) {
		years.push(year);
	}
	return years.map((year) => {
		const label = `${String(year).padStart(2, "0")}또래`;
		return { value: `y${String(year).padStart(2, "0")}`, label };
	});
}

const PARTIAL_ATTENDANCE = {
	op: "notEquals",
	fieldId: "stay_type",
	value: "full",
} as const;

/** 2026 여름 청년부 수련회 신청서 — 기존 하드코딩 폼을 데이터로 옮긴 것 */
export const retreat2026Definition: FormDefinitionInput = {
	schemaVersion: 1,
	title: "2026 여름 청년부 수련회 - 나 찾으심?",
	description:
		"2026년 6월 25일(목) ~ 6월 28일(일) 광림 수도원에서 진행되는 청년부 수련회에 초대합니다.",
	timezone: "Asia/Seoul",
	closesAt: "2026-06-14T23:59",
	identity: { fieldId: "phone" },
	contact: { phoneFieldId: "phone" },
	fields: [
		{
			id: "name",
			type: "short_text",
			label: "이름",
			required: true,
			minLength: 2,
			maxLength: 20,
		},
		{
			id: "phone",
			type: "phone",
			label: "전화번호",
			columnHeader: "연락처",
			required: true,
			placeholder: "010-0000-0000",
		},
		{
			id: "gender",
			type: "single_choice",
			label: "성별",
			required: true,
			display: "chips",
			options: [
				{ value: "male", label: "남성" },
				{ value: "female", label: "여성" },
			],
		},
		{
			id: "department",
			type: "single_choice",
			label: "소속",
			required: true,
			display: "chips",
			options: [
				{ value: "youth1", label: "청년1부" },
				{ value: "youth2", label: "청년2부" },
				{ value: "other", label: "기타" },
			],
		},
		{
			id: "age_group",
			type: "single_choice",
			label: "또래",
			required: true,
			display: "dropdown",
			options: ageGroupOptions(),
		},
		{
			id: "stay_type",
			type: "single_choice",
			label: "숙박 형태",
			columnHeader: "숙박형태",
			required: true,
			display: "cards",
			options: [
				{ value: "full", label: "3박4일", description: "전체 일정 참석" },
				{ value: "n2d3", label: "2박3일", description: "부분 참석" },
				{ value: "n1d2", label: "1박2일", description: "부분 참석" },
				{ value: "day", label: "무박", description: "숙박 없이 당일만 참석" },
			],
		},
		{
			id: "arrival_at",
			type: "datetime",
			label: "참석(픽업) 희망 일시",
			columnHeader: "참석일시",
			required: true,
			min: "2026-06-25T06:00",
			max: "2026-06-28T22:00",
			stepMinutes: 30,
			showIf: PARTIAL_ATTENDANCE,
		},
		{
			id: "arrival_note",
			type: "long_text",
			label: "추가 안내 사항",
			columnHeader: "픽업메모",
			maxLength: 500,
			placeholder: "예: 금요일 저녁 7시 이후 도착 예정",
			showIf: PARTIAL_ATTENDANCE,
		},
		{
			id: "tf_team",
			type: "single_choice",
			label: "TF팀 지원",
			columnHeader: "TF팀",
			display: "chips",
			options: [
				{ value: "none", label: "없음" },
				{ value: "praise", label: "찬양팀" },
				{ value: "program", label: "프로그램팀" },
				{ value: "media", label: "미디어팀" },
			],
		},
		{
			id: "can_ride",
			type: "boolean",
			label: "차량 지원 가능 여부",
			columnHeader: "차량지원",
			trueLabel: "가능",
			falseLabel: "불가",
		},
		{
			id: "ride_details",
			type: "long_text",
			label: "차량 지원 상세",
			columnHeader: "차량정보",
			maxLength: 500,
			placeholder: "탑승 가능 인원, 출발 위치 등",
			showIf: { op: "equals", fieldId: "can_ride", value: true },
		},
	],
	pages: [
		{
			id: "personal",
			title: "기본 정보",
			fieldIds: ["name", "phone", "gender", "department", "age_group"],
		},
		{
			id: "attendance",
			title: "참석 정보",
			fieldIds: ["stay_type", "arrival_at", "arrival_note"],
		},
		{
			id: "support",
			title: "봉사 및 지원",
			fieldIds: ["tf_team", "can_ride", "ride_details"],
		},
	],
	payment: {
		account: "계좌 정보를 관리자 화면에서 입력하세요",
		amount: {
			kind: "byOption",
			fieldId: "stay_type",
			amounts: { full: 65_000, n2d3: 55_000, n1d2: 45_000, day: 35_000 },
		},
		reminder: { firstAfterDays: 7, intervalDays: 7, maxCount: 3 },
	},
	notifications: {
		onCreate:
			"[죽전우리교회 청년부]\n{{name}}님, 수련회 신청완료\n금액: {{amount}}원 ({{stay_type}})\n계좌: {{account}}\n{{link}}",
		onUpdate:
			"[죽전우리교회 청년부]\n{{name}}님, 수정완료.\n금액: {{amount}}원 ({{stay_type}})\n계좌: {{account}}\n{{link}}",
		onReminder:
			"[죽전우리교회 청년부]\n{{name}}님, 회비 입금이 확인되지 않았습니다.\n금액: {{amount}}원 ({{stay_type}})\n계좌: {{account}}\n{{link}}",
	},
	completionMessage:
		"신청이 완료되었습니다. 문자로 안내드린 계좌로 회비를 입금해주세요.",
};
