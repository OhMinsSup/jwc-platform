import { Input } from "@jwc/ui/components/input";
import { Search } from "lucide-react";

/** 목록 내 검색 (type=search: Esc로 지우기, 모바일 검색 키보드) */
export function SearchInput({
	value,
	onChange,
	label,
}: {
	value: string;
	onChange: (value: string) => void;
	label: string;
}) {
	return (
		<div className="relative w-full sm:w-72">
			<Search
				aria-hidden
				className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
			/>
			<Input
				aria-label={label}
				className="bg-card h-9 pl-9"
				onChange={(event) => onChange(event.target.value)}
				placeholder={label}
				type="search"
				value={value}
			/>
		</div>
	);
}
