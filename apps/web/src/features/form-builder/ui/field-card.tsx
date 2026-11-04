import type { FieldDef } from "@jwc/form-core/definition/fields";
import { IssueList } from "@jwc/ui-patterns/components/form-controls";
import { Badge } from "@jwc/ui/components/badge";
import { cn } from "@jwc/ui/lib/utils";
import { ChevronDown, CircleAlert, Lock, Split } from "lucide-react";
import { memo } from "react";

import { FIELD_CATALOG } from "../model/field-catalog";
import { FIELD_ICONS } from "./add-field-menu";
import { useEditorActions } from "./editor-context";
import { FieldCardActions, fieldDomId } from "./field-card-actions";
import { FieldEditor } from "./field-editor";

function RequiredMark() {
	return (
		<>
			<span aria-hidden className="text-destructive ml-1">
				*
			</span>
			<span className="sr-only">(필수)</span>
		</>
	);
}

function SummaryText({ field }: { field: FieldDef }) {
	const { lockedFieldIds } = useEditorActions();
	return (
		<span className="min-w-0 flex-1">
			<span className="block truncate font-medium">
				{field.label || "제목 없음"}
				{field.required && <RequiredMark />}
			</span>
			<span className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-xs">
				<span>{FIELD_CATALOG[field.type].label}</span>
				<span className="font-mono">{field.id}</span>
				{lockedFieldIds.has(field.id) && (
					<span className="inline-flex items-center gap-0.5">
						<Lock aria-hidden className="h-3 w-3" />
						발행됨
					</span>
				)}
			</span>
		</span>
	);
}

/** 접힌 카드의 한 줄 요약: 유형 아이콘, 제목/ID, 상태 배지 */
function CardSummary({
	field,
	issueCount,
	open,
}: {
	field: FieldDef;
	issueCount: number;
	open: boolean;
}) {
	const Icon = FIELD_ICONS[field.type];
	return (
		<>
			<Icon aria-hidden className="text-muted-foreground h-4 w-4 shrink-0" />
			<SummaryText field={field} />
			{field.showIf && (
				<Badge className="hidden gap-1 sm:inline-flex" variant="secondary">
					<Split aria-hidden className="h-3 w-3" />
					조건부
				</Badge>
			)}
			{issueCount > 0 && (
				<Badge className="gap-1" variant="destructive">
					<CircleAlert aria-hidden className="h-3 w-3" />
					오류 {issueCount}
				</Badge>
			)}
			<ChevronDown
				aria-hidden
				className={cn(
					"text-muted-foreground h-4 w-4 shrink-0 transition-transform",
					open && "rotate-180",
				)}
			/>
		</>
	);
}

interface FieldCardProps {
	canMoveDown: boolean;
	canMoveUp: boolean;
	field: FieldDef;
	focusOnMount: boolean;
	issues: readonly string[] | undefined;
	onToggle: (fieldId: string) => void;
	open: boolean;
}

/**
 * 질문 카드. 접힌 상태에서는 요약 한 줄만 그리고 편집기를 마운트하지 않는다
 * (질문 200개여도 DOM/메모리는 펼친 카드 수에 비례).
 * memo: 다른 질문을 편집해도 이 카드의 field 객체는 같으므로 리렌더되지 않는다.
 */
export const FieldCard = memo(function FieldCardView(props: FieldCardProps) {
	const {
		field,
		open,
		focusOnMount,
		issues,
		canMoveUp,
		canMoveDown,
		onToggle,
	} = props;
	const bodyId = `${fieldDomId(field.id)}-body`;
	const issueCount = issues?.length ?? 0;
	return (
		<article
			aria-label={field.label}
			className={cn(
				"bg-card scroll-mt-28 rounded-lg border transition-shadow",
				open && "border-brand/40 ring-brand/20 shadow-sm ring-1",
				issueCount > 0 && "border-destructive/50",
			)}
			id={fieldDomId(field.id)}
		>
			<div className="flex items-center gap-1 p-2 pl-3">
				<button
					aria-controls={bodyId}
					aria-expanded={open}
					className="focus-visible:ring-ring flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-md py-1.5 text-left focus-visible:ring-2 focus-visible:outline-none"
					onClick={() => onToggle(field.id)}
					type="button"
				>
					<CardSummary field={field} issueCount={issueCount} open={open} />
				</button>
				<FieldCardActions
					canMoveDown={canMoveDown}
					canMoveUp={canMoveUp}
					field={field}
				/>
			</div>
			{open && (
				<div className="space-y-4 border-t p-4 sm:p-5" id={bodyId}>
					<IssueList issues={issues} />
					<FieldEditor field={field} focusOnMount={focusOnMount} />
				</div>
			)}
		</article>
	);
});
