import { ToggleGroup, ToggleGroupItem } from "@jwc/ui/components/toggle-group";

interface Segment<V extends string> {
	/** 옆에 붙는 개수 */
	count?: number;
	label: string;
	value: V;
}

interface SegmentedControlProps<V extends string> {
	label: string;
	onChange: (value: V) => void;
	segments: readonly Segment<V>[];
	value: V;
}

/**
 * 필터/보기 전환. Base UI ToggleGroup이라 화살표 키 이동과 눌림 상태(aria-pressed) 안내가 기본 제공된다.
 * 선택 해제(빈 값)는 허용하지 않는다.
 */
export function SegmentedControl<V extends string>({
	label,
	segments,
	value,
	onChange,
}: SegmentedControlProps<V>) {
	return (
		<ToggleGroup
			aria-label={label}
			className="bg-muted/60 inline-flex gap-0.5 rounded-lg border p-0.5"
			onValueChange={(next) => {
				// Base UI는 값 배열을 준다. 단일 선택이며 해제(빈 배열)와 목록에 없는 값은 무시한다
				const [selected] = next;
				const segment = segments.find((item) => item.value === selected);
				if (segment !== undefined) {
					onChange(segment.value);
				}
			}}
			value={[value]}
		>
			{segments.map((segment) => (
				<ToggleGroupItem
					className="text-muted-foreground data-pressed:bg-background data-pressed:text-foreground h-8 rounded-md px-3 text-sm data-pressed:shadow-xs"
					key={segment.value}
					value={segment.value}
				>
					{segment.label}
					{segment.count !== undefined && (
						<span className="text-muted-foreground ml-1.5 text-xs tabular-nums">
							{segment.count}
						</span>
					)}
				</ToggleGroupItem>
			))}
		</ToggleGroup>
	);
}
