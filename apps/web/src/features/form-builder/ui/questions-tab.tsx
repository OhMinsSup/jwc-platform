import { DEFINITION_LIMITS } from "@jwc/form-core/definition/definition";
import type { FormDefinition } from "@jwc/form-core/definition/definition";
import type { FieldType } from "@jwc/form-core/definition/fields";
import { Callout } from "@jwc/ui-patterns/components/callout";
import { ChoiceSelect } from "@jwc/ui-patterns/components/pickers";
import { Button } from "@jwc/ui/components/button";
import { Plus } from "lucide-react";
import { useCallback } from "react";

import { nextFieldId, nextPageId } from "../model/ids";
import {
	useEditorActions,
	useEditorIndex,
	useEditorIssues,
} from "./editor-context";
import { PageSection, pageDomId } from "./page-section";
import type { OpenCards } from "./use-open-cards";

/** 페이지 목차: 화면이 길어져도 원하는 페이지로 바로 이동 (앵커 링크라 키보드/스크린리더 친화적) */
function Outline({ definition }: { definition: FormDefinition }) {
	const issues = useEditorIssues();
	return (
		<nav aria-label="페이지 목차" className="lg:sticky lg:top-28">
			<ol className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible">
				{definition.pages.map((page, index) => {
					const errorCount =
						(issues.byPage.get(page.id)?.length ?? 0) +
						page.fieldIds.reduce(
							(sum, id) => sum + (issues.byField.get(id)?.length ?? 0),
							0,
						);
					return (
						<li className="shrink-0" key={page.id}>
							<a
								className="hover:bg-muted focus-visible:ring-ring flex items-center gap-2 rounded-lg px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
								href={`#${pageDomId(page.id)}`}
							>
								<span className="text-muted-foreground tabular-nums">
									{index + 1}
								</span>
								<span className="max-w-40 truncate">
									{page.title || "제목 없음"}
								</span>
								<span className="text-muted-foreground ml-auto text-xs tabular-nums">
									{page.fieldIds.length}
								</span>
								{errorCount > 0 && (
									<span className="bg-destructive text-destructive-foreground rounded-full px-1.5 text-xs tabular-nums">
										<span className="sr-only">오류 </span>
										{errorCount}
									</span>
								)}
							</a>
						</li>
					);
				})}
			</ol>
		</nav>
	);
}

/** 과거 JSON 편집으로 어느 페이지에도 없는 질문이 있으면 배치하도록 안내 */
function UnplacedFields({ definition }: { definition: FormDefinition }) {
	const { dispatch } = useEditorActions();
	const { unplaced } = useEditorIndex();
	if (unplaced.length === 0) {
		return null;
	}
	const pageChoices = definition.pages.map((page) => ({
		value: page.id,
		label: page.title || page.id,
	}));
	const place = (fieldId: string, pageId: string) =>
		dispatch({
			type: "field/move",
			fieldId,
			pageId,
			index: Number.MAX_SAFE_INTEGER,
		});
	return (
		<Callout
			role="note"
			title={`어느 페이지에도 배치되지 않은 질문이 ${unplaced.length}개 있습니다`}
			tone="warning"
		>
			<ul className="space-y-2">
				{unplaced.map((field) => (
					<li
						className="flex flex-wrap items-center gap-2 text-sm"
						key={field.id}
					>
						<span className="min-w-0 flex-1 truncate">
							{field.label || field.id}
						</span>
						<ChoiceSelect
							choices={pageChoices}
							className="h-8 w-48"
							label={`"${field.label}" 배치할 페이지`}
							onChange={(pageId) => place(field.id, pageId)}
							placeholder="페이지에 추가"
							value={undefined}
						/>
					</li>
				))}
			</ul>
		</Callout>
	);
}

function AddPageButton({ disabled }: { disabled: boolean }) {
	const { dispatch, getDefinition, announce } = useEditorActions();
	const addPage = () => {
		const pageId = nextPageId(getDefinition());
		dispatch({ type: "page/add", pageId });
		announce("페이지를 추가했습니다");
		requestAnimationFrame(() =>
			document
				.getElementById(pageDomId(pageId))
				?.scrollIntoView({ block: "start" }),
		);
	};
	return (
		<Button
			className="w-full border-dashed"
			disabled={disabled}
			onClick={addPage}
			variant="outline"
		>
			<Plus aria-hidden className="mr-1.5 h-4 w-4" />
			페이지 추가
		</Button>
	);
}

/** 왼쪽 목차 + 전체 펼치기 (작은 화면에서는 위쪽 가로 스크롤 목차) */
function OutlineAside({
	definition,
	cards,
}: {
	definition: FormDefinition;
	cards: OpenCards;
}) {
	const allOpen = cards.openIds.size > 0;
	return (
		<aside className="space-y-3">
			<Outline definition={definition} />
			<Button
				className="text-muted-foreground hidden w-full justify-start px-3 lg:inline-flex"
				onClick={() =>
					cards.setAll(allOpen ? [] : definition.fields.map((f) => f.id))
				}
				size="sm"
				variant="ghost"
			>
				{allOpen ? "모든 질문 접기" : "모든 질문 펼치기"}
			</Button>
		</aside>
	);
}

export function QuestionsTab({
	definition,
	cards,
}: {
	definition: FormDefinition;
	cards: OpenCards;
}) {
	const { dispatch, getDefinition, announce } = useEditorActions();
	const { openIds, focusId, toggle, reveal } = cards;
	/** 안정된 콜백 → memo된 FieldCard가 열림/닫힘 외의 이유로 리렌더되지 않는다 */
	const addField = useCallback(
		(pageId: string, fieldType: FieldType) => {
			const fieldId = nextFieldId(getDefinition());
			dispatch({ type: "field/add", pageId, fieldId, fieldType });
			reveal(fieldId, true);
			announce("질문을 추가했습니다. 제목을 입력하세요");
		},
		[dispatch, getDefinition, announce, reveal],
	);
	// 열 최소 폭을 0으로 둔다: 기본(auto)이면 작은 화면에서 가로 목차(shrink-0 항목들)의 폭이
	// 열 폭이 되어 페이지 전체가 가로로 넘친다. 목차는 자기 영역 안에서만 가로 스크롤된다
	return (
		<div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
			<OutlineAside cards={cards} definition={definition} />
			<div className="min-w-0 space-y-6">
				<UnplacedFields definition={definition} />
				{definition.pages.map((page, pageIndex) => (
					<PageSection
						focusId={focusId}
						key={page.id}
						onAddField={addField}
						onToggle={toggle}
						openIds={openIds}
						page={page}
						pageCount={definition.pages.length}
						pageIndex={pageIndex}
					/>
				))}
				<AddPageButton
					disabled={definition.pages.length >= DEFINITION_LIMITS.pages}
				/>
			</div>
		</div>
	);
}
