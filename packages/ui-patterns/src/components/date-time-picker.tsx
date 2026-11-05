import { cn } from "@jwc/ui/lib/utils";

import { joinDateTime, splitDateTime } from "../lib/local-date";
import { DatePicker } from "./date-picker";
import type { PickerSize } from "./date-picker";
import { TimePicker } from "./time-picker";

const DEFAULT_TIME = "00:00";

export interface DateTimePickerProps {
	className?: string;
	clearable?: boolean;
	/** 날짜만 고르고 시각을 안 골랐을 때 붙일 시각 (예: 마감은 "23:59") */
	defaultTime?: string;
	describedBy?: string;
	id?: string;
	invalid?: boolean;
	/** "YYYY-MM-DDTHH:mm" — 달력에서는 날짜 부분만 막는다 (시각 범위는 값 검증이 맡는다) */
	max?: string;
	min?: string;
	onChange: (value: string | undefined) => void;
	size?: PickerSize;
	stepMinutes?: number;
	/** "YYYY-MM-DDTHH:mm" (브라우저 datetime-local 입력과 같은 형식) */
	value: string | undefined;
}

/** 날짜 선택기 + 시각 선택기. 날짜가 없으면 값도 없으므로 시각 칸은 날짜를 고른 뒤에 열린다 */
export function DateTimePicker({
	value,
	onChange,
	min,
	max,
	stepMinutes,
	defaultTime = DEFAULT_TIME,
	id,
	describedBy,
	invalid,
	clearable,
	size,
	className,
}: DateTimePickerProps) {
	const { date, time } = splitDateTime(value);
	return (
		// 시각 칸은 글자 폭만큼, 날짜 칸이 나머지 (좁은 열에서도 잘리지 않게)
		<div
			className={cn("grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]", className)}
		>
			<DatePicker
				clearable={clearable}
				describedBy={describedBy}
				id={id}
				invalid={invalid}
				max={splitDateTime(max).date}
				min={splitDateTime(min).date}
				onChange={(next) => onChange(joinDateTime(next, time, defaultTime))}
				size={size}
				value={date}
			/>
			<TimePicker
				disabled={!date}
				invalid={invalid}
				onChange={(next) => onChange(joinDateTime(date, next, defaultTime))}
				size={size}
				stepMinutes={stepMinutes}
				value={date ? (time ?? defaultTime) : time}
			/>
		</div>
	);
}
