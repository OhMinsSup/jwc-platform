import type { FieldOf } from "@jwc/form-core/definition/fields";
import { formatPhone, normalizePhone } from "@jwc/form-core/field-types/text";
import { Input } from "@jwc/ui/components/input";
import { Textarea } from "@jwc/ui/components/textarea";

import type { FieldProps } from "./types";

const INPUT_CLASS = "bg-card h-12 px-3.5 md:text-[15px]";

function textValue(value: unknown): string {
	return typeof value === "string" ? value : "";
}

export function ShortTextField({
	field,
	inputId,
	value,
	invalid,
	onChange,
}: FieldProps<FieldOf<"short_text">>) {
	return (
		<Input
			aria-invalid={invalid}
			className={INPUT_CLASS}
			id={inputId}
			maxLength={field.maxLength}
			onChange={(e) => onChange(e.target.value)}
			placeholder={field.placeholder}
			value={textValue(value)}
		/>
	);
}

export function LongTextField({
	field,
	inputId,
	value,
	invalid,
	onChange,
}: FieldProps<FieldOf<"long_text">>) {
	return (
		<Textarea
			aria-invalid={invalid}
			className="bg-card min-h-28 resize-y px-3.5 py-3 md:text-[15px]"
			id={inputId}
			maxLength={field.maxLength}
			onChange={(e) => onChange(e.target.value)}
			placeholder={field.placeholder}
			value={textValue(value)}
		/>
	);
}

export function EmailField({
	field,
	inputId,
	value,
	invalid,
	onChange,
}: FieldProps<FieldOf<"email">>) {
	return (
		<Input
			aria-invalid={invalid}
			autoComplete="email"
			className={INPUT_CLASS}
			id={inputId}
			inputMode="email"
			onChange={(e) => onChange(e.target.value)}
			placeholder={field.placeholder}
			type="email"
			value={textValue(value)}
		/>
	);
}

/** 입력하는 동안 010-1234-5678 형태로 보여준다. 저장 시 정규화는 form-core가 담당. */
export function PhoneField({
	field,
	inputId,
	value,
	invalid,
	onChange,
}: FieldProps<FieldOf<"phone">>) {
	return (
		<Input
			aria-invalid={invalid}
			autoComplete="tel"
			className={INPUT_CLASS}
			id={inputId}
			inputMode="tel"
			maxLength={13}
			onChange={(e) => onChange(formatPhone(normalizePhone(e.target.value)))}
			placeholder={field.placeholder ?? "010-0000-0000"}
			type="tel"
			value={textValue(value)}
		/>
	);
}

export function NumberField({
	field,
	inputId,
	value,
	invalid,
	onChange,
}: FieldProps<FieldOf<"number">>) {
	return (
		<Input
			aria-invalid={invalid}
			className={INPUT_CLASS}
			id={inputId}
			inputMode={field.integer ? "numeric" : "decimal"}
			max={field.max}
			min={field.min}
			onChange={(e) =>
				onChange(e.target.value === "" ? undefined : Number(e.target.value))
			}
			placeholder={field.placeholder}
			step={field.integer ? 1 : "any"}
			type="number"
			value={typeof value === "number" ? value : ""}
		/>
	);
}
