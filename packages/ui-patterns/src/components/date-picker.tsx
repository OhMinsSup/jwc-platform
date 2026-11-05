import { Button } from "@jwc/ui/components/button";
import { Calendar } from "@jwc/ui/components/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@jwc/ui/components/popover";
import { cn } from "@jwc/ui/lib/utils";
import { CalendarDays } from "lucide-react";
import { useState } from "react";
import type { Matcher } from "react-day-picker";
import { ko } from "react-day-picker/locale";

import {
	formatDateLabel,
	formatDateLabelShort,
	parseLocalDate,
	toLocalDateString,
} from "../lib/local-date";

/** 크기: 관리자 기본(32px, 짧은 날짜) / 공개 신청 화면(48px, 15px 글자, 긴 날짜, 큰 달력 칸) */
export const PICKER_SIZES = {
	default: "",
	lg: "h-12 px-3.5 md:text-[15px]",
} as const;
const CALENDAR_SIZES = {
	default: "",
	lg: "[--cell-size:--spacing(10)]",
} as const;
const LABELS = { default: formatDateLabelShort, lg: formatDateLabel } as const;
export type PickerSize = keyof typeof PICKER_SIZES;

export interface DatePickerProps {
	className?: string;
	/** 값 지우기 버튼 (선택 항목에서만) */
	clearable?: boolean;
	describedBy?: string;
	id?: string;
	invalid?: boolean;
	/** 고를 수 있는 마지막 날 "YYYY-MM-DD" */
	max?: string;
	/** 고를 수 있는 첫날 "YYYY-MM-DD" */
	min?: string;
	onChange: (value: string | undefined) => void;
	placeholder?: string;
	size?: PickerSize;
	/** "YYYY-MM-DD" (브라우저 date 입력과 같은 형식) */
	value: string | undefined;
}

/** min/max → 달력에서 막을 날짜 */
function disabledDays(min: string | undefined, max: string | undefined) {
	const matchers: Matcher[] = [];
	const first = parseLocalDate(min);
	const last = parseLocalDate(max);
	if (first) {
		matchers.push({ before: first });
	}
	if (last) {
		matchers.push({ after: last });
	}
	return matchers;
}

interface CalendarPanelProps {
	clearable: boolean;
	size: PickerSize;
	max: string | undefined;
	min: string | undefined;
	onCommit: (value: string | undefined) => void;
	selected: Date | undefined;
}

/** 팝오버 안: 한국어 달력 + (선택 항목이면) 지우기 */
function CalendarPanel({
	selected,
	min,
	max,
	clearable,
	size,
	onCommit,
}: CalendarPanelProps) {
	return (
		<>
			<Calendar
				autoFocus
				className={CALENDAR_SIZES[size]}
				defaultMonth={selected ?? parseLocalDate(min)}
				disabled={disabledDays(min, max)}
				locale={ko}
				mode="single"
				onSelect={(day) => onCommit(day ? toLocalDateString(day) : undefined)}
				selected={selected}
			/>
			{clearable && selected && (
				<div className="border-t p-2">
					<Button
						className="w-full"
						onClick={() => onCommit(undefined)}
						size="sm"
						variant="ghost"
					>
						날짜 지우기
					</Button>
				</div>
			)}
		</>
	);
}

/** 입력 모양 트리거 버튼 클래스 (값이 없으면 placeholder 색) */
function triggerClass(
	hasValue: boolean,
	size: PickerSize,
	className: string | undefined,
) {
	return cn(
		"bg-card w-full justify-start gap-2 px-2.5 font-normal",
		!hasValue && "text-muted-foreground",
		PICKER_SIZES[size],
		className,
	);
}

/**
 * 날짜 선택기: 입력 모양 버튼 + 한국어 달력 팝오버.
 * 값은 타임존 없는 "YYYY-MM-DD" 문자열이라 브라우저 타임존과 무관하다. 고르면 바로 닫힌다.
 */
export function DatePicker({
	value,
	onChange,
	min,
	max,
	id,
	describedBy,
	invalid,
	placeholder = "날짜 선택",
	clearable = false,
	size = "default",
	className,
}: DatePickerProps) {
	const [open, setOpen] = useState(false);
	const selected = parseLocalDate(value);
	const commit = (next: string | undefined) => {
		onChange(next);
		setOpen(false);
	};
	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger
				render={
					<Button
						aria-describedby={describedBy}
						aria-invalid={invalid}
						className={triggerClass(Boolean(selected), size, className)}
						id={id}
						variant="outline"
					/>
				}
			>
				<CalendarDays aria-hidden className="text-muted-foreground size-4" />
				<span className="truncate tabular-nums">
					{selected ? LABELS[size](selected) : placeholder}
				</span>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-auto p-0">
				<CalendarPanel
					clearable={clearable}
					max={max}
					min={min}
					onCommit={commit}
					selected={selected}
					size={size}
				/>
			</PopoverContent>
		</Popover>
	);
}
