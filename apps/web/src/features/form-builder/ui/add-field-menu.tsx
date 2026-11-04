import type { FieldType } from "@jwc/form-core/definition/fields";
import { Button } from "@jwc/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@jwc/ui/components/dropdown-menu";
import {
	Calendar,
	CalendarClock,
	CircleDot,
	Clock,
	Hash,
	Info,
	ListChecks,
	Mail,
	Phone,
	Plus,
	Star,
	TextAlignStart,
	ToggleLeft,
	Type,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Fragment } from "react";

import {
	FIELD_CATALOG,
	FIELD_GROUPS,
	FIELD_TYPE_ORDER,
} from "../model/field-catalog";

/** 질문 유형 → 아이콘. 카탈로그(모델)는 UI 라이브러리를 모르게 두고 여기서만 매핑 */
export const FIELD_ICONS: Record<FieldType, LucideIcon> = {
	short_text: Type,
	long_text: TextAlignStart,
	number: Hash,
	phone: Phone,
	email: Mail,
	single_choice: CircleDot,
	multi_choice: ListChecks,
	boolean: ToggleLeft,
	rating: Star,
	date: Calendar,
	time: Clock,
	datetime: CalendarClock,
	statement: Info,
};

/** 그룹별 유형 목록은 카탈로그에서 한 번만 파생 */
const TYPES_BY_GROUP = FIELD_GROUPS.map(({ group, label }) => ({
	label,
	types: FIELD_TYPE_ORDER.filter((type) => FIELD_CATALOG[type].group === group),
}));

function FieldTypeItem({
	type,
	onAdd,
}: {
	type: FieldType;
	onAdd: (type: FieldType) => void;
}) {
	const Icon = FIELD_ICONS[type];
	return (
		<DropdownMenuItem className="gap-3" onClick={() => onAdd(type)}>
			<Icon aria-hidden className="text-muted-foreground h-4 w-4 shrink-0" />
			<span className="flex flex-col">
				<span>{FIELD_CATALOG[type].label}</span>
				<span className="text-muted-foreground text-xs">
					{FIELD_CATALOG[type].hint}
				</span>
			</span>
		</DropdownMenuItem>
	);
}

interface AddFieldMenuProps {
	disabled?: boolean;
	onAdd: (type: FieldType) => void;
	pageTitle: string;
}

/** 질문 유형 메뉴. Radix 메뉴라 화살표 키 이동/타이핑 검색/Esc가 기본 제공된다 */
export function AddFieldMenu({
	onAdd,
	disabled,
	pageTitle,
}: AddFieldMenuProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				disabled={disabled}
				render={
					<Button
						aria-label={`"${pageTitle}" 페이지에 질문 추가`}
						className="w-full border-dashed"
						variant="outline"
					/>
				}
			>
				<Plus aria-hidden className="mr-1.5 h-4 w-4" />
				질문 추가
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-72">
				{TYPES_BY_GROUP.map(({ label, types }, index) => (
					<Fragment key={label}>
						{index > 0 && <DropdownMenuSeparator />}
						<DropdownMenuGroup>
							<DropdownMenuLabel className="text-muted-foreground text-xs">
								{label}
							</DropdownMenuLabel>
							{types.map((type) => (
								<FieldTypeItem key={type} onAdd={onAdd} type={type} />
							))}
						</DropdownMenuGroup>
					</Fragment>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
