import type { FieldOf } from "@jwc/form-core/definition/fields";
import { DatePicker } from "@jwc/ui-patterns/components/date-picker";
import { DateTimePicker } from "@jwc/ui-patterns/components/date-time-picker";
import { TimePicker } from "@jwc/ui-patterns/components/time-picker";

import type { FieldProps } from "./types";

/**
 * 날짜/시간 질문은 전용 선택기(@jwc/ui-patterns)를 쓴다: 한국어 달력 + 오전/오후 시각 선택으로
 * 브라우저마다 다른 네이티브 입력 모양을 없앤다.
 * 값 형식은 그대로 타임존 없는 로컬 문자열("YYYY-MM-DD", "HH:mm", "YYYY-MM-DDTHH:mm")이고,
 * min/max/간격 검증은 form-core가 맡는다 (선택기는 범위 밖 날짜를 미리 막아 줄 뿐).
 */
const asString = (value: unknown) =>
	typeof value === "string" && value !== "" ? value : undefined;

export function DateField({
	field,
	inputId,
	value,
	invalid,
	onChange,
}: FieldProps<FieldOf<"date">>) {
	return (
		<DatePicker
			id={inputId}
			invalid={invalid}
			max={field.max}
			min={field.min}
			onChange={onChange}
			size="lg"
			value={asString(value)}
		/>
	);
}

export function TimeField({
	field,
	inputId,
	value,
	invalid,
	onChange,
}: FieldProps<FieldOf<"time">>) {
	return (
		<TimePicker
			id={inputId}
			invalid={invalid}
			onChange={onChange}
			size="lg"
			stepMinutes={field.stepMinutes}
			value={asString(value)}
		/>
	);
}

export function DateTimeField({
	field,
	inputId,
	value,
	invalid,
	onChange,
}: FieldProps<FieldOf<"datetime">>) {
	return (
		<DateTimePicker
			id={inputId}
			invalid={invalid}
			max={field.max}
			min={field.min}
			onChange={onChange}
			size="lg"
			stepMinutes={field.stepMinutes}
			value={asString(value)}
		/>
	);
}
