import { cn } from "@jwc/ui/lib/utils";

export interface CountOption<V extends string> {
	count: number | undefined;
	label: string;
	value: V;
}

interface CountFilterProps<V extends string> {
	/** 묶음의 접근 가능한 이름 (예: "상태로 거르기") */
	label: string;
	onChange: (value: V) => void;
	options: readonly CountOption<V>[];
	value: V;
}

/** 열 수는 선택지 수에서 정한다 (고아 칸 없이). 작은 화면은 2~3열로 접는다 (가로 스크롤 없음) */
const COLUMNS: Record<number, string> = {
	2: "grid-cols-2",
	3: "grid-cols-3",
	4: "grid-cols-2 sm:grid-cols-4",
	5: "grid-cols-3 sm:grid-cols-5",
};

/**
 * 개수 카드 = 목록의 거르개. 카드마다 "라벨 위 개수"이고, 고른 카드는 1.5px 잉크색 테두리.
 * 0도 같은 모양으로 "0". 증감/아이콘 없음.
 */
export function CountFilter<V extends string>({
	label,
	options,
	value,
	onChange,
}: CountFilterProps<V>) {
	return (
		<fieldset
			className={cn(
				"grid min-w-0 gap-2",
				COLUMNS[options.length] ?? "grid-cols-2 sm:grid-cols-4",
			)}
		>
			<legend className="sr-only">{label}</legend>
			{options.map((option) => {
				const selected = option.value === value;
				return (
					<button
						aria-pressed={selected}
						className={cn(
							"bg-card focus-visible:ring-ring flex min-w-0 flex-col items-start rounded-xl border px-3.5 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none",
							selected
								? "border-foreground outline-foreground outline-[0.5px] outline-solid"
								: "hover:border-border-strong",
						)}
						key={option.value}
						onClick={() => onChange(option.value)}
						type="button"
					>
						<span
							className={cn(
								"text-[13px]",
								selected
									? "text-foreground font-medium"
									: "text-muted-foreground",
							)}
						>
							{option.label}
						</span>
						<span className="text-base font-semibold tabular-nums">
							{option.count ?? 0}
						</span>
					</button>
				);
			})}
		</fieldset>
	);
}
