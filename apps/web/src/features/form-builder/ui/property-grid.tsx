import type { FieldDef } from "@jwc/form-core/definition/fields";
import { DatePicker } from "@jwc/ui-patterns/components/date-picker";
import { DateTimePicker } from "@jwc/ui-patterns/components/date-time-picker";
import {
	FormRow,
	NumberInput,
} from "@jwc/ui-patterns/components/form-controls";
import type { FieldIds } from "@jwc/ui-patterns/components/form-controls";
import { ChoiceSelect } from "@jwc/ui-patterns/components/pickers";
import { Input } from "@jwc/ui/components/input";
import { Switch } from "@jwc/ui/components/switch";
import type { ComponentType } from "react";

import type { FieldPatch } from "../model/actions";
import { PROPERTY_SPECS } from "../model/property-specs";
import type { PropertySpec } from "../model/property-specs";

type Value = string | number | boolean | undefined;

type Kind = PropertySpec["kind"];

interface InputProps<K extends Kind = Kind> {
	ids: FieldIds;
	onChange: (value: Value) => void;
	/** 교집합: kind가 유니온인 spec(integer|number)도 좁혀진다 */
	spec: PropertySpec & { kind: K };
	value: Value;
}

const ariaOf = (ids: FieldIds) => ({
	"aria-describedby": ids.describedBy,
	"aria-invalid": ids.invalid,
	id: ids.inputId,
});

const asText = (value: Value) => (typeof value === "string" ? value : "");

function NumberProperty({
	spec,
	value,
	ids,
	onChange,
}: InputProps<"integer" | "number">) {
	return (
		<NumberInput
			{...ariaOf(ids)}
			max={spec.max}
			min={spec.min}
			onValueChange={onChange}
			step={spec.kind === "integer" ? 1 : "any"}
			value={typeof value === "number" ? value : undefined}
		/>
	);
}

function TextProperty({ spec, value, ids, onChange }: InputProps<"text">) {
	return (
		<Input
			{...ariaOf(ids)}
			maxLength={spec.maxLength}
			onChange={(e) => onChange(e.target.value)}
			value={asText(value)}
		/>
	);
}

/** 날짜 범위(min/max) 속성. 선택기의 값 형식(YYYY-MM-DD, YYYY-MM-DDTHH:mm)이 정의 형식과 같다 */
function DateProperty({
	spec,
	value,
	ids,
	onChange,
}: InputProps<"date" | "datetime">) {
	const common = {
		clearable: true,
		describedBy: ids.describedBy,
		id: ids.inputId,
		invalid: ids.invalid,
		onChange,
		value: asText(value) || undefined,
	};
	// 범위 경계는 분 단위로 정확히 고를 수 있게 1분 간격
	return spec.kind === "date" ? (
		<DatePicker {...common} />
	) : (
		<DateTimePicker {...common} stepMinutes={1} />
	);
}

function SelectProperty({ spec, value, ids, onChange }: InputProps<"select">) {
	return (
		<ChoiceSelect
			choices={spec.choices.map((c) => ({
				value: String(c.value),
				label: c.label,
			}))}
			describedBy={ids.describedBy}
			id={ids.inputId}
			onChange={(raw) =>
				onChange(spec.choices.find((c) => String(c.value) === raw)?.value)
			}
			value={value === undefined ? undefined : String(value)}
		/>
	);
}

function SwitchProperty({ value, ids, onChange }: InputProps<"switch">) {
	return (
		<Switch
			{...ariaOf(ids)}
			checked={value === true}
			onCheckedChange={onChange}
		/>
	);
}

/** spec.kind → 입력 컴포넌트. 표(PROPERTY_SPECS)를 그리는 유일한 조회 지점 (분기문 없음) */
const PROPERTY_INPUTS: { [K in Kind]: ComponentType<InputProps<K>> } = {
	integer: NumberProperty,
	number: NumberProperty,
	text: TextProperty,
	date: DateProperty,
	datetime: DateProperty,
	select: SelectProperty,
	switch: SwitchProperty,
};

/** kind를 K로 받아 표의 컴포넌트와 props의 spec 타입이 같은 K로 묶인다 (단언 없이 좁혀짐) */
function PropertyInput<K extends Kind>(props: InputProps<K>) {
	const kind: K = props.spec.kind;
	const Component: ComponentType<InputProps<K>> = PROPERTY_INPUTS[kind];
	return <Component {...props} />;
}

/** 표가 가리키는 속성 값. 입력이 다루는 원시값만 넘기고 그 밖의 값은 "비어 있음"으로 본다 */
function propertyValue(field: FieldDef, key: string): Value {
	const values: Readonly<Record<string, unknown>> = field;
	const value = values[key];
	return typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "boolean"
		? value
		: undefined;
}

/** 숫자는 범위 안내를, 나머지는 spec의 hint를 쓴다 */
function hintOf(spec: PropertySpec): string | undefined {
	if (spec.kind === "integer" || spec.kind === "number") {
		if (spec.hint) {
			return spec.hint;
		}
		return spec.optional ? "비우면 제한 없음" : undefined;
	}
	return "hint" in spec ? spec.hint : undefined;
}

interface PropertyGridProps {
	field: FieldDef;
	onPatch: (patch: FieldPatch) => void;
}

export function PropertyGrid({ field, onPatch }: PropertyGridProps) {
	const specs = PROPERTY_SPECS[field.type];
	if (specs.length === 0) {
		return null;
	}
	return (
		<div className="grid gap-4 sm:grid-cols-2">
			{specs.map((spec) => (
				<FormRow
					className={spec.kind === "switch" ? "sm:col-span-2" : undefined}
					hint={hintOf(spec)}
					key={spec.key}
					label={spec.label}
				>
					{(ids) => (
						<PropertyInput
							ids={ids}
							onChange={(value) => onPatch({ [spec.key]: value })}
							spec={spec}
							value={propertyValue(field, spec.key)}
						/>
					)}
				</FormRow>
			))}
		</div>
	);
}
