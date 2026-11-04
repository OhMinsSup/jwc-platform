import type { FieldOf } from "@jwc/form-core/definition/fields";
import { Input } from "@jwc/ui/components/input";

import type { FieldProps } from "./types";

/**
 * 네이티브 날짜/시간 입력을 쓴다: 모바일 OS 피커, 접근성, min/max/step 검증을 공짜로 얻는다.
 * 값은 타임존 없는 로컬 문자열("YYYY-MM-DDTHH:mm")로 다루므로 브라우저 타임존 영향을 받지 않는다.
 */
const CLASS = "h-12 bg-muted/30";
const SECONDS_PER_MINUTE = 60;

const asString = (value: unknown) => (typeof value === "string" ? value : "");
const orUndefined = (text: string) => (text === "" ? undefined : text);

export function DateField({
	field,
	inputId,
	value,
	invalid,
	onChange,
}: FieldProps<FieldOf<"date">>) {
	return (
		<Input
			aria-invalid={invalid}
			className={CLASS}
			id={inputId}
			max={field.max}
			min={field.min}
			onChange={(e) => onChange(orUndefined(e.target.value))}
			type="date"
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
		<Input
			aria-invalid={invalid}
			className={CLASS}
			id={inputId}
			onChange={(e) => onChange(orUndefined(e.target.value))}
			step={field.stepMinutes * SECONDS_PER_MINUTE}
			type="time"
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
		<Input
			aria-invalid={invalid}
			className={CLASS}
			id={inputId}
			max={field.max}
			min={field.min}
			onChange={(e) => onChange(orUndefined(e.target.value.slice(0, 16)))}
			step={field.stepMinutes * SECONDS_PER_MINUTE}
			type="datetime-local"
			value={asString(value)}
		/>
	);
}
