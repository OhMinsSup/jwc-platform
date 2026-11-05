import { cn } from "@jwc/ui/lib/utils";

import {
	fitsHourGrid,
	hourOptions,
	minuteOptions,
	parseTime,
	timeSlots,
	toTimeString,
} from "../lib/local-date";
import type { PickerSize } from "./date-picker";
import { ChoiceSelect } from "./pickers";

const DEFAULT_STEP_MINUTES = 30;

/** 선택 트리거 크기 (Select 트리거는 data-size 높이를 쓰므로 같은 선택자로 덮는다) */
const TRIGGER_SIZES: Record<PickerSize, string> = {
	default: "bg-card min-w-24",
	lg: "bg-card min-w-28 px-3.5 data-[size=default]:h-12 md:text-[15px]",
};

export interface TimePickerProps {
	className?: string;
	describedBy?: string;
	disabled?: boolean;
	id?: string;
	invalid?: boolean;
	onChange: (value: string | undefined) => void;
	size?: PickerSize;
	/** 분 간격 (정의의 stepMinutes). 1시간을 나누면 시/분 두 칸, 아니면 시각 목록 하나 */
	stepMinutes?: number;
	/** "HH:mm" (브라우저 time 입력과 같은 형식) */
	value: string | undefined;
}

/** 간격이 1시간을 나누지 않을 때: 자정부터 간격마다의 시각 목록 */
function SlotSelect(props: TimePickerProps & { step: number }) {
	const choices = timeSlots(props.step).map((slot) => ({
		value: slot,
		label: slot,
	}));
	return (
		<ChoiceSelect
			choices={choices}
			className={cn(TRIGGER_SIZES[props.size ?? "default"], props.className)}
			describedBy={props.describedBy}
			disabled={props.disabled}
			id={props.id}
			invalid={props.invalid}
			onChange={props.onChange}
			placeholder="시각 선택"
			value={props.value}
		/>
	);
}

/**
 * 시각 선택기: "오전/오후 n시" + "mm분" 두 선택 (네이티브 time 입력의 브라우저별 모양 차이 대신).
 * 시만 고르면 분은 00분으로 채운다. 값은 "HH:mm".
 */
export function TimePicker(props: TimePickerProps) {
	const step = props.stepMinutes ?? DEFAULT_STEP_MINUTES;
	if (!fitsHourGrid(step)) {
		return <SlotSelect {...props} step={step} />;
	}
	const { value, onChange, id, describedBy, invalid, disabled, className } =
		props;
	const trigger = TRIGGER_SIZES[props.size ?? "default"];
	const time = parseTime(value);
	return (
		<div className={cn("grid grid-cols-2 gap-2", className)}>
			<ChoiceSelect
				choices={hourOptions()}
				className={trigger}
				describedBy={describedBy}
				disabled={disabled}
				id={id}
				invalid={invalid}
				onChange={(hour) =>
					onChange(toTimeString(Number(hour), time?.minute ?? 0))
				}
				placeholder="시"
				value={time === undefined ? undefined : String(time.hour)}
			/>
			<ChoiceSelect
				choices={minuteOptions(step)}
				className={trigger}
				disabled={disabled}
				invalid={invalid}
				label="분"
				onChange={(minute) =>
					onChange(toTimeString(time?.hour ?? 0, Number(minute)))
				}
				placeholder="분"
				value={time === undefined ? undefined : String(time.minute)}
			/>
		</div>
	);
}
