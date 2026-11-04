import type { ChoiceOption, FieldOf } from "@jwc/form-core";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@jwc/ui/components/select";
import { cn } from "@jwc/ui/lib/utils";
import { Check } from "lucide-react";

import type { FieldProps } from "./types";

function Chip({
	selected,
	onClick,
	children,
}: {
	selected: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			aria-pressed={selected}
			className={cn(
				"focus-visible:ring-ring cursor-pointer rounded-full border px-5 py-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
				selected
					? "border-primary bg-primary text-primary-foreground"
					: "border-border bg-muted/40 text-muted-foreground hover:bg-muted",
			)}
			onClick={onClick}
			type="button"
		>
			{children}
		</button>
	);
}

function OptionCard({
	option,
	selected,
	onClick,
}: {
	option: ChoiceOption;
	selected: boolean;
	onClick: () => void;
}) {
	return (
		<button
			aria-pressed={selected}
			className={cn(
				"focus-visible:ring-ring flex w-full cursor-pointer items-center justify-between rounded-xl border p-4 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none",
				selected
					? "border-primary bg-primary/5"
					: "border-border bg-muted/30 hover:bg-muted/60",
			)}
			onClick={onClick}
			type="button"
		>
			<span>
				<span className="block font-medium">{option.label}</span>
				{option.description && (
					<span className="text-muted-foreground block text-sm">
						{option.description}
					</span>
				)}
			</span>
			{selected && <Check className="text-primary h-5 w-5" />}
		</button>
	);
}

/** 단일 선택의 표시 방식(드롭다운/카드/칩)이 공유하는 입력 */
interface SingleChoiceViewProps {
	field: FieldOf<"single_choice">;
	inputId: string;
	onSelect: (value: string) => void;
	selected: string | undefined;
}

function ChoiceDropdown({
	field,
	inputId,
	selected,
	onSelect,
}: SingleChoiceViewProps) {
	return (
		<Select
			items={field.options}
			onValueChange={(next) => {
				if (next !== null) {
					onSelect(next);
				}
			}}
			value={selected ?? null}
		>
			<SelectTrigger className="bg-muted/30 h-12 w-full" id={inputId}>
				<SelectValue placeholder={field.placeholder ?? "선택하세요"} />
			</SelectTrigger>
			<SelectContent>
				{field.options.map((option) => (
					<SelectItem key={option.value} value={option.value}>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

function ChoiceCards({
	field,
	inputId,
	selected,
	onSelect,
}: SingleChoiceViewProps) {
	return (
		<div className="grid gap-3" id={inputId} role="radiogroup">
			{field.options.map((option) => (
				<OptionCard
					key={option.value}
					onClick={() => onSelect(option.value)}
					option={option}
					selected={selected === option.value}
				/>
			))}
		</div>
	);
}

function ChoiceChips({
	field,
	inputId,
	selected,
	onSelect,
}: SingleChoiceViewProps) {
	return (
		<div className="flex flex-wrap gap-2" id={inputId} role="radiogroup">
			{field.options.map((option) => (
				<Chip
					key={option.value}
					onClick={() => onSelect(option.value)}
					selected={selected === option.value}
				>
					{option.label}
				</Chip>
			))}
		</div>
	);
}

export function SingleChoiceField({
	field,
	inputId,
	value,
	onChange,
}: FieldProps<FieldOf<"single_choice">>) {
	const view: SingleChoiceViewProps = {
		field,
		inputId,
		onSelect: onChange,
		selected: typeof value === "string" ? value : undefined,
	};
	if (field.display === "dropdown") {
		return <ChoiceDropdown {...view} />;
	}
	if (field.display === "cards") {
		return <ChoiceCards {...view} />;
	}
	return <ChoiceChips {...view} />;
}

export function MultiChoiceField({
	field,
	inputId,
	value,
	onChange,
}: FieldProps<FieldOf<"multi_choice">>) {
	const selected = Array.isArray(value) ? value : [];
	const toggle = (optionValue: string) => {
		const next = selected.includes(optionValue)
			? selected.filter((v) => v !== optionValue)
			: [...selected, optionValue];
		onChange(next.length > 0 ? next : undefined);
	};
	return (
		<div className="flex flex-wrap gap-2" id={inputId}>
			{field.options.map((option) => (
				<Chip
					key={option.value}
					onClick={() => toggle(option.value)}
					selected={selected.includes(option.value)}
				>
					{option.label}
				</Chip>
			))}
		</div>
	);
}

export function BooleanField({
	field,
	inputId,
	value,
	onChange,
}: FieldProps<FieldOf<"boolean">>) {
	return (
		<div className="flex gap-2" id={inputId} role="radiogroup">
			<Chip onClick={() => onChange(true)} selected={value === true}>
				{field.trueLabel}
			</Chip>
			<Chip onClick={() => onChange(false)} selected={value === false}>
				{field.falseLabel}
			</Chip>
		</div>
	);
}

export function RatingField({
	field,
	inputId,
	value,
	onChange,
}: FieldProps<FieldOf<"rating">>) {
	const scores = Array.from({ length: field.scale }, (_, i) => i + 1);
	return (
		<div className="flex flex-wrap gap-2" id={inputId} role="radiogroup">
			{scores.map((score) => (
				<Chip
					key={score}
					onClick={() => onChange(score)}
					selected={value === score}
				>
					{score}
				</Chip>
			))}
		</div>
	);
}
