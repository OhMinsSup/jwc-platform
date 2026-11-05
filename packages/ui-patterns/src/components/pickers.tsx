import { Button } from "@jwc/ui/components/button";
import { Label } from "@jwc/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@jwc/ui/components/select";
import { Switch } from "@jwc/ui/components/switch";
import { cn } from "@jwc/ui/lib/utils";
import type { LucideIcon } from "lucide-react";
import { useId } from "react";

interface IconButtonProps {
	disabled?: boolean;
	icon: LucideIcon;
	id?: string;
	/** 아이콘만 보이므로 스크린리더용 이름이 필수 */
	label: string;
	onClick: () => void;
}

/** 아이콘 전용 버튼. 이름 누락(접근성 결함)이 타입 수준에서 불가능하다 */
export function IconButton({
	label,
	icon: Icon,
	onClick,
	disabled,
	id,
}: IconButtonProps) {
	return (
		<Button
			aria-label={label}
			disabled={disabled}
			id={id}
			onClick={onClick}
			size="icon"
			title={label}
			variant="ghost"
		>
			<Icon aria-hidden className="h-4 w-4" />
		</Button>
	);
}

interface Choice {
	disabled?: boolean;
	label: string;
	value: string;
}

interface ChoiceSelectProps {
	choices: readonly Choice[];
	className?: string;
	describedBy?: string;
	disabled?: boolean;
	id?: string;
	invalid?: boolean;
	/** 보이는 라벨이 없을 때의 접근 가능한 이름 */
	label?: string;
	labelledBy?: string;
	onChange: (value: string) => void;
	placeholder?: string;
	/** undefined = 아직 고르지 않음 (placeholder 표시) */
	value: string | undefined;
}

/** 선택지 목록을 데이터로 받는 Select. 편집기의 모든 드롭다운이 이 하나를 쓴다 */
export function ChoiceSelect(props: ChoiceSelectProps) {
	const {
		choices,
		value,
		onChange,
		label,
		labelledBy,
		placeholder,
		className,
		invalid,
		id,
		describedBy,
		disabled,
	} = props;
	return (
		<Select
			disabled={disabled}
			// items: 트리거에 값(opt_1) 대신 라벨을 보여준다. null = 선택 없음(placeholder)
			items={choices}
			onValueChange={(next) => {
				if (next !== null) {
					onChange(next);
				}
			}}
			value={value ?? null}
		>
			<SelectTrigger
				aria-describedby={describedBy}
				aria-invalid={invalid}
				aria-label={label}
				aria-labelledby={labelledBy}
				className={cn("w-full", className)}
				id={id}
			>
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>
			<SelectContent>
				{choices.map((choice) => (
					<SelectItem
						disabled={choice.disabled}
						key={choice.value}
						value={choice.value}
					>
						{choice.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

/** 스위치 + 클릭 가능한 라벨 */
export function LabeledSwitch({
	checked,
	onChange,
	label,
}: {
	checked: boolean;
	onChange: (on: boolean) => void;
	label: string;
}) {
	const id = useId();
	return (
		<div className="flex items-center gap-2">
			<Switch checked={checked} id={id} onCheckedChange={onChange} />
			<Label htmlFor={id}>{label}</Label>
		</div>
	);
}
