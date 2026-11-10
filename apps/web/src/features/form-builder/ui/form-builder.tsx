import type { FormDefinition } from "@jwc/form-core/definition/definition";
import { LiveRegion } from "@jwc/ui-patterns/components/live-region";
import type { LiveRegionHandle } from "@jwc/ui-patterns/components/live-region";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@jwc/ui/components/alert-dialog";
import { Button } from "@jwc/ui/components/button";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@jwc/ui/components/tabs";
import { useCallback, useRef, useState } from "react";
import type { ReactNode } from "react";

import { buildIndex } from "../model/derive";
import type { IssueIndex } from "../model/issues";
import {
	EditorActionsProvider,
	EditorIndexProvider,
	EditorIssuesProvider,
} from "./editor-context";
import { fieldDomId } from "./field-card-actions";
import { pageDomId } from "./page-section";
import { QuestionsTab } from "./questions-tab";
import { SettingsTab } from "./settings/settings-tab";
import { settingsDomId } from "./settings/shared";
import { Toolbar } from "./toolbar";
import {
	saveStateOf,
	useEditorCommands,
	useEditorState,
	useLeaveGuard,
	useSaveShortcut,
} from "./use-editor-session";
import type { CommandOutcome } from "./use-editor-session";
import { useOpenCards } from "./use-open-cards";
import type { OpenCards } from "./use-open-cards";

const TABS = ["questions", "settings"] as const;
type Tab = (typeof TABS)[number];

/** 닫힌 탭 목록의 값이므로 알 수 없는 값은 오지 않는다. 와도 무시한다 */
function isTab(value: unknown): value is Tab {
	return TABS.some((tab) => tab === value);
}

export interface FormBuilderProps {
	initial: FormDefinition;
	lockedFieldIds: readonly string[];
	/** 저장된 초안을 발행 (호출 전에 편집기가 검증과 저장을 마친다) */
	onPublish: () => Promise<CommandOutcome>;
	onSave: (definition: FormDefinition) => Promise<CommandOutcome>;
}

function scrollToId(id: string): void {
	requestAnimationFrame(() =>
		document
			.getElementById(id)
			?.scrollIntoView({ behavior: "smooth", block: "start" }),
	);
}

/** 표시 순서상 첫 오류 위치 (질문 → 페이지 → 설정 구역) */
function firstIssueTarget(definition: FormDefinition, issues: IssueIndex) {
	const { ordered, unplaced } = buildIndex(definition);
	const field = [...ordered, ...unplaced].find((f) => issues.byField.has(f.id));
	if (field) {
		return {
			tab: "questions" as const,
			fieldId: field.id,
			domId: fieldDomId(field.id),
		};
	}
	const page = definition.pages.find((p) => issues.byPage.has(p.id));
	if (page) {
		return { tab: "questions" as const, domId: pageDomId(page.id) };
	}
	const [section] = issues.bySection.keys();
	return section
		? { tab: "settings" as const, domId: settingsDomId(section) }
		: null;
}

function TabCount({ count }: { count: number }) {
	if (count === 0) {
		return null;
	}
	return (
		<span className="bg-destructive text-destructive-foreground ml-1.5 rounded-full px-1.5 text-xs tabular-nums">
			<span className="sr-only">오류 </span>
			{count}
		</span>
	);
}

const VIEW_TRIGGER = "h-8 rounded-md px-3 data-active:bg-background";

/** 편집 화면 전환 (툴바 왼쪽에 들어간다) */
function ViewSwitch({ issues }: { issues: IssueIndex }) {
	return (
		<TabsList
			aria-label="편집 화면"
			className="bg-muted/60 h-auto rounded-lg border p-0.5"
		>
			<TabsTrigger className={VIEW_TRIGGER} value="questions">
				질문 · 페이지
				<TabCount count={issues.questionCount} />
			</TabsTrigger>
			<TabsTrigger className={VIEW_TRIGGER} value="settings">
				설정
				<TabCount count={issues.total - issues.questionCount} />
			</TabsTrigger>
		</TabsList>
	);
}

/** 비활성 화면은 Radix가 언마운트한다 → 보이는 화면의 DOM만 유지 (펼침 상태는 cards에 남는다) */
function EditorViews({
	definition,
	cards,
}: {
	definition: FormDefinition;
	cards: OpenCards;
}) {
	return (
		<>
			<TabsContent className="mt-6" value="questions">
				<QuestionsTab cards={cards} definition={definition} />
			</TabsContent>
			<TabsContent className="mt-6" value="settings">
				<SettingsTab definition={definition} />
			</TabsContent>
		</>
	);
}

/** "첫 오류로 이동": 탭 전환 → 카드 펼치기 → 스크롤 */
function useShowIssues(
	getDefinition: () => FormDefinition,
	cards: OpenCards,
	setTab: (tab: Tab) => void,
) {
	return useCallback(
		(target: IssueIndex) => {
			const where = firstIssueTarget(getDefinition(), target);
			if (!where) {
				return;
			}
			setTab(where.tab);
			if ("fieldId" in where && where.fieldId) {
				cards.reveal(where.fieldId, false);
			}
			scrollToId(where.domId);
		},
		[cards, getDefinition, setTab],
	);
}

/** 변경 빈도별로 나눈 세 컨텍스트를 한 번에 제공 */
function EditorProviders({
	session,
	children,
}: {
	session: ReturnType<typeof useEditorState>;
	children: ReactNode;
}) {
	return (
		<EditorActionsProvider value={session.actions}>
			<EditorIndexProvider value={session.index}>
				<EditorIssuesProvider value={session.issues}>
					{children}
				</EditorIssuesProvider>
			</EditorIndexProvider>
		</EditorActionsProvider>
	);
}

/** 이탈 확인: 저장하고 이동 / 버리고 이동 / 머무르기 */
function LeaveConfirm({
	blocker,
	save,
}: {
	blocker: ReturnType<typeof useLeaveGuard>;
	save: () => Promise<boolean>;
}) {
	const saveAndLeave = async () => {
		if (await save()) {
			blocker.proceed?.();
		} else {
			blocker.reset?.();
		}
	};
	return (
		<AlertDialog
			onOpenChange={(open) => !open && blocker.reset?.()}
			open={blocker.status === "blocked"}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>저장하지 않은 변경사항이 있습니다</AlertDialogTitle>
					<AlertDialogDescription>
						이동하기 전에 초안을 저장할까요? 저장하지 않으면 변경사항이
						사라집니다.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter className="gap-2 sm:gap-0">
					<AlertDialogCancel>머무르기</AlertDialogCancel>
					<Button onClick={() => blocker.proceed?.()} variant="ghost">
						저장하지 않고 이동
					</Button>
					<AlertDialogAction onClick={saveAndLeave}>
						저장하고 이동
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

/** 편집기 루트: 상태/명령 훅을 묶고 레이아웃을 그린다 */
export function FormBuilder({
	initial,
	lockedFieldIds,
	onSave,
	onPublish,
}: FormBuilderProps) {
	const announcer = useRef<LiveRegionHandle>(null);
	const session = useEditorState(initial, lockedFieldIds, announcer);
	const [tab, setTab] = useState<Tab>("questions");
	const cards = useOpenCards();
	const showIssues = useShowIssues(session.getDefinition, cards, setTab);
	const commands = useEditorCommands({
		...session,
		markSaved: session.setSaved,
		onSave,
		onPublish,
		onInvalid: showIssues,
	});
	useSaveShortcut(commands.save, session.isDirty);
	const blocker = useLeaveGuard(session.isDirty);
	const { issues } = session;
	const { publish: handlePublish, save: handleSave } = commands;
	return (
		<EditorProviders session={session}>
			<LiveRegion ref={announcer} />
			<Tabs
				onValueChange={(value) => {
					if (isTab(value)) {
						setTab(value);
					}
				}}
				value={tab}
			>
				<Toolbar
					busy={commands.busy}
					issueCount={issues.total}
					notice={commands.notice}
					onPublish={handlePublish}
					onSave={handleSave}
					onShowIssues={() => showIssues(issues)}
					saveState={saveStateOf(commands.busy, session.dirty)}
					views={<ViewSwitch issues={issues} />}
				/>
				<EditorViews cards={cards} definition={session.definition} />
			</Tabs>
			<LeaveConfirm blocker={blocker} save={commands.save} />
		</EditorProviders>
	);
}
