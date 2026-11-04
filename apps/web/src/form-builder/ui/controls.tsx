import { Badge } from "@jwc/ui/components/badge";
import { Button } from "@jwc/ui/components/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@jwc/ui/components/collapsible";
import { Input } from "@jwc/ui/components/input";
import { Label } from "@jwc/ui/components/label";
import { cn } from "@jwc/ui/lib/utils";
import { ChevronDown, CircleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useId, useState } from "react";
import type { ComponentProps, KeyboardEvent, ReactNode } from "react";

export interface FieldIds {
	/** aria-describedby 값 (힌트/오류가 있을 때만) */
	describedBy: string | undefined;
	inputId: string;
	invalid: boolean;
}

interface FormRowProps {
	/** id/aria 속성을 받아 입력을 그린다 → 라벨/설명/오류 연결이 항상 맞는다 */
	children: (ids: FieldIds) => ReactNode;
	className?: string;
	error?: string;
	hint?: string;
	label: string;
}

export function FormRow({
	label,
	hint,
	error,
	className,
	children,
}: FormRowProps) {
	const inputId = useId();
	const hintId = `${inputId}-hint`;
	const errorId = `${inputId}-error`;
	const describedBy =
		[hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") ||
		undefined;
	return (
		<div className={cn("space-y-1.5", className)}>
			<Label htmlFor={inputId}>{label}</Label>
			{children({ inputId, describedBy, invalid: Boolean(error) })}
			{hint && (
				<p className="text-muted-foreground text-xs" id={hintId}>
					{hint}
				</p>
			)}
			{error && (
				<p className="text-destructive text-xs" id={errorId}>
					{error}
				</p>
			)}
		</div>
	);
}

type CommitInputProps = Omit<ComponentProps<"input">, "value" | "onChange"> & {
	value: string;
	/** 포커스를 잃거나 Enter일 때 한 번만 호출. Escape는 되돌린다. */
	onCommit: (value: string) => void;
};

/**
 * 값 변경이 다른 곳에 연쇄되는 입력(질문 ID, 선택지 값)에 쓴다.
 * 타이핑 중간 상태("a", "ab"...)마다 참조를 고쳐 쓰지 않도록 확정 시점에만 반영한다.
 */
export function CommitInput({
	value,
	onCommit,
	onKeyDown,
	...props
}: CommitInputProps) {
	const [text, setText] = useState(value);
	// 바깥 값이 바뀌면(되돌리기/다른 곳의 변경) 입력 중인 글자를 그 값으로 맞춘다.
	// 이펙트 대신 렌더 중에 비교해 맞춘다 (낡은 값이 한 번 그려지는 연쇄 렌더가 없다)
	const [syncedValue, setSyncedValue] = useState(value);
	if (syncedValue !== value) {
		setSyncedValue(value);
		setText(value);
	}
	const commit = () => {
		if (text !== value) {
			onCommit(text.trim());
		}
	};
	const handleKey = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter") {
			event.preventDefault();
			commit();
		} else if (event.key === "Escape") {
			setText(value);
		}
		onKeyDown?.(event);
	};
	return (
		<Input
			{...props}
			onBlur={commit}
			onChange={(event) => setText(event.target.value)}
			onKeyDown={handleKey}
			value={text}
		/>
	);
}

type NumberInputProps = Omit<
	ComponentProps<"input">,
	"value" | "onChange" | "type"
> & {
	value: number | undefined;
	onValueChange: (value: number | undefined) => void;
};

/** 빈칸 = undefined (선택 속성 해제), 그 외는 숫자. 숫자가 아니면 반영하지 않는다. */
export function NumberInput({
	value,
	onValueChange,
	...props
}: NumberInputProps) {
	return (
		<Input
			{...props}
			inputMode="numeric"
			onChange={(event) => {
				const raw = event.target.value;
				if (raw === "") {
					onValueChange(undefined);
					return;
				}
				const parsed = Number(raw);
				if (Number.isFinite(parsed)) {
					onValueChange(parsed);
				}
			}}
			type="number"
			value={value ?? ""}
		/>
	);
}

/** 카드/섹션 단위 오류 목록. 오류가 없으면 아무것도 그리지 않는다. */
export function IssueList({
	issues,
	className,
}: {
	issues?: readonly string[];
	className?: string;
}) {
	if (!issues || issues.length === 0) {
		return null;
	}
	return (
		<ul
			className={cn(
				"border-destructive/30 bg-destructive/5 text-destructive space-y-1 rounded-md border p-3 text-sm",
				className,
			)}
		>
			{issues.map((issue) => (
				<li className="flex gap-2" key={issue}>
					<CircleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
					<span>{issue}</span>
				</li>
			))}
		</ul>
	);
}

interface SectionProps {
	/** 제목 줄 오른쪽 (스위치 등) */
	action?: ReactNode;
	children?: ReactNode;
	description?: string;
	id?: string;
	issues?: readonly string[];
	title: string;
}

/** 설정 화면의 카드. 제목은 h2로 문서 구조(스크린리더 헤딩 탐색)를 만든다 */
export function Section({
	title,
	description,
	action,
	issues,
	children,
	id,
}: SectionProps) {
	const headingId = useId();
	return (
		<section
			aria-labelledby={headingId}
			className="bg-card scroll-mt-24 rounded-xl border p-5 shadow-xs sm:p-6"
			id={id}
		>
			<div className="flex items-start justify-between gap-4">
				<div className="space-y-1">
					<h2 className="text-base font-semibold" id={headingId}>
						{title}
					</h2>
					{description && (
						<p className="text-muted-foreground text-sm">{description}</p>
					)}
				</div>
				{action}
			</div>
			{Boolean(children) && <div className="mt-5 space-y-5">{children}</div>}
			<IssueList className="mt-4" issues={issues} />
		</section>
	);
}

interface DisclosureProps {
	/** 접혀 있어도 보이는 상태 표시 (예: "설정됨") */
	badge?: string;
	children: ReactNode;
	contentClassName?: string;
	defaultOpen?: boolean;
	icon?: LucideIcon;
	label: string;
}

/** 펼치기/접기 영역. 접힌 동안 내용은 마운트하지 않는다 (Radix Collapsible) */
export function Disclosure({
	label,
	icon: Icon,
	badge,
	defaultOpen = false,
	contentClassName,
	children,
}: DisclosureProps) {
	const [open, setOpen] = useState(defaultOpen);
	return (
		<Collapsible onOpenChange={setOpen} open={open}>
			<CollapsibleTrigger
				render={
					<Button
						className="text-muted-foreground -ml-2"
						size="sm"
						variant="ghost"
					/>
				}
			>
				{Icon && <Icon aria-hidden className="mr-1 h-4 w-4" />}
				{label}
				{badge && (
					<Badge className="ml-2" variant="secondary">
						{badge}
					</Badge>
				)}
				<ChevronDown
					aria-hidden
					className={cn(
						"ml-1 h-4 w-4 transition-transform",
						open && "rotate-180",
					)}
				/>
			</CollapsibleTrigger>
			<CollapsibleContent className={contentClassName}>
				{children}
			</CollapsibleContent>
		</Collapsible>
	);
}
