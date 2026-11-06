import { Button } from "@jwc/ui/components/button";
import { cn } from "@jwc/ui/lib/utils";
import { CircleAlert, CircleCheck, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export type SaveState = "saved" | "dirty" | "saving";

const SAVE_STATE: Record<SaveState, { text: string; dot: string }> = {
	saved: { text: "저장됨", dot: "bg-success" },
	dirty: { text: "저장 안 됨", dot: "bg-warning" },
	saving: { text: "저장 중…", dot: "bg-warning animate-pulse" },
};

interface ToolbarProps {
	busy: boolean;
	issueCount: number;
	notice: string | null;
	onPublish: () => void;
	onSave: () => void;
	onShowIssues: () => void;
	saveState: SaveState;
	/** 왼쪽: 편집 화면 전환 (질문 / 설정) */
	views: ReactNode;
}

function StatusLine({
	saveState,
	issueCount,
	onShowIssues,
}: Pick<ToolbarProps, "saveState" | "issueCount" | "onShowIssues">) {
	const save = SAVE_STATE[saveState];
	return (
		<div className="flex items-center gap-3 text-sm">
			<span className="text-muted-foreground flex items-center gap-1.5">
				<span aria-hidden className={cn("h-2 w-2 rounded-full", save.dot)} />
				{save.text}
			</span>
			<span aria-hidden className="bg-border h-4 w-px" />
			{issueCount > 0 ? (
				<button
					className="text-destructive focus-visible:ring-ring inline-flex cursor-pointer items-center gap-1 rounded font-medium hover:underline focus-visible:ring-2 focus-visible:outline-none"
					onClick={onShowIssues}
					type="button"
				>
					<CircleAlert aria-hidden className="h-4 w-4" />
					고칠 곳 {issueCount}건
					<span className="sr-only">, 첫 오류로 이동</span>
				</button>
			) : (
				<span className="text-success inline-flex items-center gap-1 font-medium">
					<CircleCheck aria-hidden className="h-4 w-4" />
					발행 가능
				</span>
			)}
		</div>
	);
}

/**
 * 편집기 상단에 떠 있는 작업 막대: 화면 전환 / 상태 / 저장·발행.
 * 스크롤해도 따라오며(sticky, 모바일은 상단 바 아래), 작은 화면에서는 두 줄로 접힌다.
 */
export function Toolbar(props: ToolbarProps) {
	const { saveState, busy, notice, onSave, onPublish, views } = props;
	return (
		<div className="bg-background sticky top-16 z-20 rounded-xl border px-3 py-2.5 lg:top-4">
			<div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
				{views}
				<div className="flex flex-wrap items-center gap-x-4 gap-y-2">
					<StatusLine {...props} />
					<div className="flex items-center gap-2">
						<Button
							disabled={busy || saveState === "saved"}
							onClick={onSave}
							size="sm"
							variant="outline"
						>
							{busy && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
							초안 저장
							<kbd className="bg-muted text-muted-foreground hidden rounded border px-1 font-sans text-[10px] sm:inline">
								⌘S
							</kbd>
						</Button>
						<Button disabled={busy} onClick={onPublish} size="sm">
							발행
						</Button>
					</div>
				</div>
			</div>
			<output
				aria-live="polite"
				className={cn(
					"block text-sm",
					notice ? "mt-2 border-t pt-2" : "sr-only",
				)}
			>
				{notice}
			</output>
		</div>
	);
}
