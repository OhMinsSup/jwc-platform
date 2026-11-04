import { DEFINITION_LIMITS } from "@jwc/form-core";
import type { FieldType, PageDef } from "@jwc/form-core";
import { Input } from "@jwc/ui/components/input";
import { Textarea } from "@jwc/ui/components/textarea";
import { ArrowDown, ArrowUp, Split, Trash2 } from "lucide-react";
import { useId, useMemo } from "react";

import { pageConditionSources } from "../model/derive";
import { AddFieldMenu } from "./add-field-menu";
import { ConditionEditor } from "./condition-editor";
import { Disclosure, IssueList } from "./controls";
import {
	useEditorActions,
	useEditorIndex,
	useEditorIssues,
} from "./editor-context";
import { FieldCard } from "./field-card";
import { IconButton } from "./pickers";

export const pageDomId = (pageId: string) => `page-${pageId}`;

function PageCondition({
	page,
	pageIndex,
}: {
	page: PageDef;
	pageIndex: number;
}) {
	const { dispatch } = useEditorActions();
	const index = useEditorIndex();
	const sources = useMemo(
		() => pageConditionSources(index, pageIndex),
		[index, pageIndex],
	);
	return (
		<Disclosure
			badge={page.showIf ? "설정됨" : undefined}
			contentClassName="mt-2 rounded-md border p-3"
			defaultOpen={Boolean(page.showIf)}
			icon={Split}
			label="페이지 표시 조건"
		>
			<ConditionEditor
				condition={page.showIf}
				onChange={(showIf) =>
					dispatch({ type: "page/update", pageId: page.id, patch: { showIf } })
				}
				sources={sources}
				subject="이 페이지"
			/>
		</Disclosure>
	);
}

interface PageProps {
	page: PageDef;
	pageCount: number;
	pageIndex: number;
}

function PageActions({ page, pageIndex, pageCount }: PageProps) {
	const { dispatch, announce } = useEditorActions();
	const name = `"${page.title || `페이지 ${pageIndex + 1}`}"`;
	const move = (delta: -1 | 1) => {
		dispatch({ type: "page/move", pageId: page.id, delta });
		announce(`${name} 페이지를 ${pageIndex + delta + 1}번째로 옮겼습니다`);
	};
	const remove = () => {
		dispatch({ type: "page/remove", pageId: page.id });
		announce(
			`${name} 페이지를 삭제했습니다. 질문은 ${pageIndex > 0 ? "이전" : "다음"} 페이지로 옮겼습니다`,
		);
	};
	return (
		<div className="flex pt-5">
			<IconButton
				disabled={pageIndex === 0}
				icon={ArrowUp}
				label={`${name} 페이지 위로`}
				onClick={() => move(-1)}
			/>
			<IconButton
				disabled={pageIndex === pageCount - 1}
				icon={ArrowDown}
				label={`${name} 페이지 아래로`}
				onClick={() => move(1)}
			/>
			<IconButton
				disabled={pageCount <= 1}
				icon={Trash2}
				label={`${name} 페이지 삭제 (질문은 옆 페이지로 이동)`}
				onClick={remove}
			/>
		</div>
	);
}

/** 제목은 테두리 없는 큰 입력으로: 읽을 때는 제목처럼, 누르면 바로 편집 */
function PageHeader(props: PageProps) {
	const { page, pageIndex, pageCount } = props;
	const { dispatch } = useEditorActions();
	const titleId = useId();
	return (
		<div className="flex items-start gap-2">
			<div className="min-w-0 flex-1 space-y-1">
				<label
					className="text-muted-foreground text-xs font-medium"
					htmlFor={titleId}
				>
					페이지 {pageIndex + 1} / {pageCount}
				</label>
				<Input
					className="hover:border-input focus-visible:border-input h-auto border-transparent px-2 py-1 text-lg font-semibold shadow-none"
					id={titleId}
					onChange={(event) =>
						dispatch({
							type: "page/update",
							pageId: page.id,
							patch: { title: event.target.value },
						})
					}
					placeholder="페이지 제목"
					value={page.title}
				/>
			</div>
			<PageActions {...props} />
		</div>
	);
}

interface FieldListProps {
	focusId: string | null;
	onToggle: (fieldId: string) => void;
	openIds: ReadonlySet<string>;
	page: PageDef;
	pageCount: number;
	pageIndex: number;
}

/** 페이지의 질문 목록. 경계(첫 페이지 맨 위/마지막 페이지 맨 아래)에서만 이동 버튼을 막는다 */
function FieldList({
	page,
	pageIndex,
	pageCount,
	openIds,
	focusId,
	onToggle,
}: FieldListProps) {
	const index = useEditorIndex();
	const issues = useEditorIssues();
	if (page.fieldIds.length === 0) {
		return (
			<p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
				아직 질문이 없습니다. 아래에서 질문을 추가하세요.
			</p>
		);
	}
	const isLastPage = pageIndex === pageCount - 1;
	const lastPosition = page.fieldIds.length - 1;
	return (
		<ol className="space-y-2">
			{page.fieldIds.map((fieldId, position) => {
				const field = index.byId.get(fieldId);
				return (
					field && (
						<li key={fieldId}>
							<FieldCard
								canMoveDown={!(isLastPage && position === lastPosition)}
								canMoveUp={!(pageIndex === 0 && position === 0)}
								field={field}
								focusOnMount={focusId === fieldId}
								issues={issues.byField.get(fieldId)}
								onToggle={onToggle}
								open={openIds.has(fieldId)}
							/>
						</li>
					)
				);
			})}
		</ol>
	);
}

interface PageSectionProps extends FieldListProps {
	onAddField: (pageId: string, type: FieldType) => void;
}

export function PageSection(props: PageSectionProps) {
	const { page, pageIndex, pageCount, onAddField } = props;
	const { dispatch } = useEditorActions();
	const index = useEditorIndex();
	const issues = useEditorIssues();
	const title = page.title || `페이지 ${pageIndex + 1}`;
	return (
		<section
			aria-label={title}
			className="bg-card scroll-mt-28 space-y-4 rounded-xl border p-4 shadow-xs sm:p-5"
			id={pageDomId(page.id)}
		>
			<PageHeader page={page} pageCount={pageCount} pageIndex={pageIndex} />
			<Textarea
				aria-label="페이지 설명"
				className="bg-background resize-y"
				onChange={(event) =>
					dispatch({
						type: "page/update",
						pageId: page.id,
						patch: { description: event.target.value || undefined },
					})
				}
				placeholder="페이지 설명 (선택)"
				rows={1}
				value={page.description ?? ""}
			/>
			{pageIndex > 0 && <PageCondition page={page} pageIndex={pageIndex} />}
			<IssueList issues={issues.byPage.get(page.id)} />
			<FieldList {...props} />
			<AddFieldMenu
				disabled={index.byId.size >= DEFINITION_LIMITS.fields}
				onAdd={(type) => onAddField(page.id, type)}
				pageTitle={title}
			/>
		</section>
	);
}
