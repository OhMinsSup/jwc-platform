import { formatInTimeZone } from "@jwc/form-core/time";

/** 관리자 화면 시각 표시 기준. 서버/브라우저 렌더 결과가 같도록 고정 타임존을 쓴다 (상대 시간은 hydration 불일치 위험) */
const ADMIN_TIME_ZONE = "Asia/Seoul";

/** epoch ms → "2026-11-04 15:30" */
export function formatDateTime(epochMs: number): string {
	return formatInTimeZone(epochMs, ADMIN_TIME_ZONE).slice(0, 16);
}

export function formatCount(value: number): string {
	return value.toLocaleString("ko-KR");
}
