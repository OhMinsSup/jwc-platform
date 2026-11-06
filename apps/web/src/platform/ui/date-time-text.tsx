import { cn } from "@jwc/ui/lib/utils";

import { formatDateTime } from "../format";

/** "YYYY-MM-DD HH:mm(:ss)" 로컬 문자열 → <time dateTime> 값 ("YYYY-MM-DDTHH:mm(:ss)") */
const LOCAL_SEPARATOR = " ";
const DATE_TIME_LENGTH = 16;

interface DateTimeTextProps {
	className?: string;
	/**
	 * epoch ms(관리자 기준 타임존으로 표시) 또는 이미 폼 타임존으로 만든
	 * 로컬 문자열 "YYYY-MM-DD HH:mm:ss" (응답 제출 시각처럼 서버가 타임존을 적용한 값)
	 */
	value: number | string;
}

/**
 * 날짜·시각 표시 전용 컴포넌트. 항상 <time dateTime>으로 감싸 기계가 읽을 값과
 * 사람이 읽을 "2026-11-04 15:30"을 함께 두고, 숫자는 고정폭으로 맞춘다.
 * 표시 형식/타임존은 여기 한 곳에서 정한다 (화면마다 slice/format을 따로 하지 않는다).
 */
export function DateTimeText({ value, className }: DateTimeTextProps) {
	const isEpoch = typeof value === "number";
	const machine = isEpoch
		? new Date(value).toISOString()
		: value.replace(LOCAL_SEPARATOR, "T");
	const human = isEpoch
		? formatDateTime(value)
		: value.slice(0, DATE_TIME_LENGTH);
	if (!isEpoch && value === "") {
		return <span className={cn("text-muted-foreground", className)}>—</span>;
	}
	return (
		<time className={cn("tabular-nums", className)} dateTime={machine}>
			{human}
		</time>
	);
}
