import { cn } from "@jwc/ui/lib/utils";
import type { ReactNode } from "react";

export interface Stat {
	/** 수치 아래 보조 설명 (한 줄) */
	hint?: ReactNode;
	label: string;
	/** 상태를 뜻하는 수치에만 색을 쓴다 (good/bad). 나머지는 잉크 */
	tone?: "default" | "brand" | "success" | "warning";
	value: ReactNode;
}

const TONE_CLASS: Record<NonNullable<Stat["tone"]>, string> = {
	default: "text-foreground",
	brand: "text-brand-ink",
	success: "text-success",
	warning: "text-warning",
};

/** 열 수는 항목 수에서 정한다 (고아 칸이 생기지 않게) */
const COLUMNS: Record<number, string> = {
	1: "sm:grid-cols-1",
	2: "sm:grid-cols-2",
	3: "sm:grid-cols-3",
	4: "sm:grid-cols-4",
};

/**
 * 요약 수치: 카드 하나를 1px 구분선으로 나눈 띠 (수치마다 타일을 만들지 않는다).
 * 라벨(13px 회색) 위 수치(24px). 아이콘/스파크라인/증감 배지 없음.
 */
export function StatGrid({ stats }: { stats: readonly Stat[] }) {
	return (
		<dl
			className={cn(
				"bg-card grid grid-cols-2 divide-y rounded-xl border sm:divide-x sm:divide-y-0",
				COLUMNS[stats.length] ?? "sm:grid-cols-4",
			)}
		>
			{stats.map((stat) => (
				<div className="px-5 py-4" key={stat.label}>
					<dt className="text-muted-foreground text-[13px]">{stat.label}</dt>
					<dd
						className={cn(
							"mt-1 text-2xl font-semibold tracking-tight tabular-nums",
							TONE_CLASS[stat.tone ?? "default"],
						)}
					>
						{stat.value}
					</dd>
					{Boolean(stat.hint) && (
						<dd className="text-muted-foreground mt-1 text-[13px]">
							{stat.hint}
						</dd>
					)}
				</div>
			))}
		</dl>
	);
}
