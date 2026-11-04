import { cn } from "@jwc/ui/lib/utils";
import type { ReactNode } from "react";

export interface Stat {
	/** 수치 아래 보조 설명 */
	hint?: ReactNode;
	label: string;
	tone?: "default" | "brand" | "success" | "warning";
	value: ReactNode;
}

const TONE_CLASS: Record<NonNullable<Stat["tone"]>, string> = {
	default: "text-foreground",
	brand: "text-brand",
	success: "text-success",
	warning: "text-warning",
};

/** 요약 수치 카드 묶음. 수치 목록을 데이터로 받는다 */
export function StatGrid({ stats }: { stats: readonly Stat[] }) {
	return (
		<dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
			{stats.map((stat) => (
				<div
					className="bg-card rounded-xl border px-4 py-3.5 shadow-xs"
					key={stat.label}
				>
					<dt className="text-muted-foreground text-xs">{stat.label}</dt>
					<dd
						className={cn(
							"mt-1 text-2xl font-semibold tracking-tight tabular-nums",
							TONE_CLASS[stat.tone ?? "default"],
						)}
					>
						{stat.value}
					</dd>
					{Boolean(stat.hint) && (
						<dd className="text-muted-foreground mt-1 text-xs">{stat.hint}</dd>
					)}
				</div>
			))}
		</dl>
	);
}
