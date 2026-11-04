import type { FieldType } from "@jwc/form-core";

/**
 * 질문 유형별 "세부 설정" 입력을 데이터로 기술한다.
 * 화면은 이 표를 그대로 그리는 하나의 렌더러(PropertyGrid)뿐이다.
 * 새 유형/속성 추가 = 이 표에 행 추가. 값의 유효성은 여전히 form-core 스키마가 판정한다.
 */
export type PropertySpec =
	| {
			kind: "integer" | "number";
			key: string;
			label: string;
			/** true면 빈칸 허용 (undefined로 저장) */
			optional: boolean;
			min?: number;
			max?: number;
			hint?: string;
	  }
	| { kind: "text"; key: string; label: string; maxLength: number }
	| { kind: "date" | "datetime"; key: string; label: string; hint?: string }
	| {
			kind: "select";
			key: string;
			label: string;
			choices: readonly { value: string | number; label: string }[];
	  }
	| { kind: "switch"; key: string; label: string; hint?: string };

const STEP_CHOICES = [5, 10, 15, 30, 60].map((minutes) => ({
	value: minutes,
	label: minutes === 60 ? "1시간" : `${minutes}분`,
}));

const stepMinutes: PropertySpec = {
	kind: "select",
	key: "stepMinutes",
	label: "선택 간격",
	choices: STEP_CHOICES,
};

export const PROPERTY_SPECS: Record<FieldType, readonly PropertySpec[]> = {
	short_text: [
		{
			kind: "integer",
			key: "minLength",
			label: "최소 글자 수",
			optional: true,
			min: 0,
			max: 1000,
		},
		{
			kind: "integer",
			key: "maxLength",
			label: "최대 글자 수",
			optional: false,
			min: 1,
			max: 1000,
		},
	],
	long_text: [
		{
			kind: "integer",
			key: "maxLength",
			label: "최대 글자 수",
			optional: false,
			min: 1,
			max: 5000,
		},
	],
	number: [
		{ kind: "number", key: "min", label: "최솟값", optional: true },
		{ kind: "number", key: "max", label: "최댓값", optional: true },
		{
			kind: "switch",
			key: "integer",
			label: "정수만 허용",
			hint: "소수점 입력을 막습니다",
		},
	],
	phone: [],
	email: [],
	single_choice: [
		{
			kind: "select",
			key: "display",
			label: "표시 방식",
			choices: [
				{ value: "chips", label: "버튼 (선택지가 적을 때)" },
				{ value: "cards", label: "카드 (설명이 있을 때)" },
				{ value: "dropdown", label: "드롭다운 (선택지가 많을 때)" },
			],
		},
	],
	multi_choice: [
		{
			kind: "integer",
			key: "minSelect",
			label: "최소 선택 수",
			optional: true,
			min: 1,
		},
		{
			kind: "integer",
			key: "maxSelect",
			label: "최대 선택 수",
			optional: true,
			min: 1,
		},
	],
	boolean: [
		{ kind: "text", key: "trueLabel", label: "'예' 버튼 문구", maxLength: 30 },
		{
			kind: "text",
			key: "falseLabel",
			label: "'아니오' 버튼 문구",
			maxLength: 30,
		},
	],
	rating: [
		{
			kind: "select",
			key: "scale",
			label: "점수 범위",
			choices: [
				{ value: 5, label: "1 ~ 5점" },
				{ value: 10, label: "1 ~ 10점" },
			],
		},
	],
	date: [
		{
			kind: "date",
			key: "min",
			label: "선택 가능 시작일",
			hint: "비우면 제한 없음",
		},
		{
			kind: "date",
			key: "max",
			label: "선택 가능 종료일",
			hint: "비우면 제한 없음",
		},
	],
	time: [stepMinutes],
	datetime: [
		{
			kind: "datetime",
			key: "min",
			label: "선택 가능 시작",
			hint: "비우면 제한 없음",
		},
		{
			kind: "datetime",
			key: "max",
			label: "선택 가능 끝",
			hint: "비우면 제한 없음",
		},
		stepMinutes,
	],
	statement: [],
};
