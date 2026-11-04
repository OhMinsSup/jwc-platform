import type { FieldDef, FieldOf, FieldType } from "@jwc/form-core";

import { keysOf } from "../../lib/object";

/** 타입과 무관하게 모든 필드가 가지는 속성. 타입을 바꿔도 보존된다. */
type BaseFieldProps = Pick<
	FieldDef,
	"id" | "label" | "description" | "columnHeader" | "placeholder" | "showIf"
> & { required: boolean };

export type FieldGroup = "text" | "choice" | "datetime" | "etc";

interface FieldTypeInfo<K extends FieldType> {
	/** 공통 속성 + 이 타입의 기본값으로 새 필드를 만든다 */
	create: (base: BaseFieldProps) => FieldOf<K>;
	group: FieldGroup;
	/** 응답자에게 placeholder가 보이는 입력인지 */
	hasPlaceholder: boolean;
	/** 추가 메뉴의 한 줄 설명 */
	hint: string;
	/** 편집기에 보이는 유형 이름 */
	label: string;
}

type FieldCatalog = { [K in FieldType]: FieldTypeInfo<K> };

const DEFAULT_OPTION_LABELS = ["선택지 1", "선택지 2"] as const;

function defaultOptions() {
	return DEFAULT_OPTION_LABELS.map((label, index) => ({
		value: `opt_${index + 1}`,
		label,
	}));
}

/**
 * 필드 타입별 편집기 메타데이터 테이블.
 * form-core의 FIELD_TYPES(검증/포맷), 렌더러 테이블(응답 화면)과 같은 키로 맞춘다.
 */
export const FIELD_CATALOG: FieldCatalog = {
	short_text: {
		label: "단답형",
		hint: "이름처럼 짧은 글",
		group: "text",
		hasPlaceholder: true,
		create: (base) => ({ ...base, type: "short_text", maxLength: 200 }),
	},
	long_text: {
		label: "장문형",
		hint: "여러 줄 메모",
		group: "text",
		hasPlaceholder: true,
		create: (base) => ({ ...base, type: "long_text", maxLength: 2000 }),
	},
	number: {
		label: "숫자",
		hint: "인원, 나이 등",
		group: "text",
		hasPlaceholder: true,
		create: (base) => ({ ...base, type: "number", integer: false }),
	},
	phone: {
		label: "전화번호",
		hint: "휴대전화 번호 (SMS 수신에 사용 가능)",
		group: "text",
		hasPlaceholder: true,
		create: (base) => ({ ...base, type: "phone" }),
	},
	email: {
		label: "이메일",
		hint: "이메일 주소",
		group: "text",
		hasPlaceholder: true,
		create: (base) => ({ ...base, type: "email" }),
	},
	single_choice: {
		label: "객관식 (하나 선택)",
		hint: "목록에서 하나만 선택",
		group: "choice",
		hasPlaceholder: false,
		create: (base) => ({
			...base,
			type: "single_choice",
			options: defaultOptions(),
			display: "chips",
		}),
	},
	multi_choice: {
		label: "체크박스 (여러 개 선택)",
		hint: "목록에서 여러 개 선택",
		group: "choice",
		hasPlaceholder: false,
		create: (base) => ({
			...base,
			type: "multi_choice",
			options: defaultOptions(),
		}),
	},
	boolean: {
		label: "예 / 아니오",
		hint: "두 가지 중 하나",
		group: "choice",
		hasPlaceholder: false,
		create: (base) => ({
			...base,
			type: "boolean",
			trueLabel: "예",
			falseLabel: "아니오",
		}),
	},
	rating: {
		label: "점수",
		hint: "1~5점 또는 1~10점",
		group: "choice",
		hasPlaceholder: false,
		create: (base) => ({ ...base, type: "rating", scale: 5 }),
	},
	date: {
		label: "날짜",
		hint: "연-월-일",
		group: "datetime",
		hasPlaceholder: false,
		create: (base) => ({ ...base, type: "date" }),
	},
	time: {
		label: "시간",
		hint: "시:분",
		group: "datetime",
		hasPlaceholder: false,
		create: (base) => ({ ...base, type: "time", stepMinutes: 30 }),
	},
	datetime: {
		label: "날짜와 시간",
		hint: "도착 일시 등",
		group: "datetime",
		hasPlaceholder: false,
		create: (base) => ({ ...base, type: "datetime", stepMinutes: 30 }),
	},
	statement: {
		label: "안내문",
		hint: "답변 없이 설명만 표시",
		group: "etc",
		hasPlaceholder: false,
		create: (base) => ({ ...base, type: "statement", required: false }),
	},
};

export const FIELD_GROUPS: readonly { group: FieldGroup; label: string }[] = [
	{ group: "text", label: "입력" },
	{ group: "choice", label: "선택" },
	{ group: "datetime", label: "날짜 · 시간" },
	{ group: "etc", label: "기타" },
];

export const FIELD_TYPE_ORDER: FieldType[] = keysOf(FIELD_CATALOG);

function baseOf(field: FieldDef): BaseFieldProps {
	const { id, label, description, columnHeader, placeholder, showIf } = field;
	return {
		id,
		label,
		description,
		columnHeader,
		placeholder,
		showIf,
		required: field.required,
	};
}

/** 유니온을 좁힌 채로 create를 호출하는 단일 지점 */
function createOf(type: FieldType, base: BaseFieldProps): FieldDef {
	return FIELD_CATALOG[type].create(base);
}

export function createField(
	type: FieldType,
	id: string,
	label: string,
): FieldDef {
	return createOf(type, { id, label, required: false });
}

/**
 * 유형 변경: 공통 속성은 유지, 타입 전용 속성은 새 기본값.
 * 선택형끼리는 선택지를 그대로 옮긴다 (다시 입력하지 않도록).
 */
export function changeFieldType(field: FieldDef, type: FieldType): FieldDef {
	const next = createOf(type, baseOf(field));
	if ("options" in field && "options" in next) {
		return { ...next, options: field.options };
	}
	return next;
}
