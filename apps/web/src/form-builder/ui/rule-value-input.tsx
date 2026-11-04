import type { FieldDef } from "@jwc/form-core";
import { Checkbox } from "@jwc/ui/components/checkbox";
import { Input } from "@jwc/ui/components/input";
import { Label } from "@jwc/ui/components/label";
import { useId } from "react";

import {
	opNeedsValue,
	RULE_SPEC_BY_TYPE,
	valueChoicesOf,
} from "../model/conditions";
import type { ConditionRule } from "../model/conditions";
import { NumberInput } from "./controls";
import { ChoiceSelect } from "./pickers";

interface RuleValueInputProps {
	field: FieldDef;
	label: string;
	onChange: (rule: ConditionRule) => void;
	rule: ConditionRule;
}

const TRIGGER = "w-full bg-background sm:w-48";

/** 날짜/시간 질문은 브라우저 기본 선택기로 같은 형식(YYYY-MM-DD, HH:mm)을 입력받는다 */
const NATIVE_INPUT_TYPE: Partial<Record<FieldDef["type"], string>> = {
	date: "date",
	time: "time",
};

function OptionValues({ field, rule, label, onChange }: RuleValueInputProps) {
	const groupId = useId();
	if (!("options" in field)) {
		return null;
	}
	const selected = new Set(rule.values);
	const toggle = (value: string, on: boolean) => {
		const values = field.options
			.map((o) => o.value)
			.filter((v) => (v === value ? on : selected.has(v)));
		onChange({ ...rule, values });
	};
	return (
		<fieldset className="flex w-full flex-wrap gap-x-4 gap-y-2">
			<legend className="sr-only">{label}</legend>
			{field.options.map((option) => {
				const id = `${groupId}-${option.value}`;
				return (
					<div className="flex items-center gap-1.5" key={option.value}>
						<Checkbox
							checked={selected.has(option.value)}
							id={id}
							onCheckedChange={(on) => toggle(option.value, on)}
						/>
						<Label className="font-normal" htmlFor={id}>
							{option.label}
						</Label>
					</div>
				);
			})}
		</fieldset>
	);
}

/** 질문 유형에 맞는 값 입력. 선택형/예·아니오는 실제 목록에서만 고르게 해서 오타 값이 생기지 않는다 */
export function RuleValueInput(props: RuleValueInputProps) {
	const { field, rule, label, onChange } = props;
	if (!opNeedsValue(rule.op)) {
		return null;
	}
	if (rule.op === "in") {
		return <OptionValues {...props} />;
	}
	const listed = valueChoicesOf(field);
	if (listed) {
		return (
			<ChoiceSelect
				choices={listed.choices}
				className={TRIGGER}
				label={label}
				onChange={(raw) => onChange({ ...rule, value: listed.parse(raw) })}
				placeholder="선택"
				value={rule.value === undefined ? undefined : String(rule.value)}
			/>
		);
	}
	if (RULE_SPEC_BY_TYPE[field.type].valueKind === "number") {
		return (
			<NumberInput
				aria-label={label}
				className={TRIGGER}
				onValueChange={(value) => onChange({ ...rule, value: value ?? 0 })}
				value={typeof rule.value === "number" ? rule.value : undefined}
			/>
		);
	}
	return (
		<Input
			aria-label={label}
			className={TRIGGER}
			onChange={(event) => onChange({ ...rule, value: event.target.value })}
			type={NATIVE_INPUT_TYPE[field.type] ?? "text"}
			value={String(rule.value ?? "")}
		/>
	);
}
