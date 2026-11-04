import type { FieldDef } from "@jwc/form-core/definition/fields";
import { IconButton } from "@jwc/ui-patterns/components/pickers";
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
import { ArrowDown, ArrowUp, Copy, Trash2 } from "lucide-react";
import { useState } from "react";

import { moveTarget } from "../model/derive";
import { nextFieldId } from "../model/ids";
import { referencesTo } from "../model/references";
import { useEditorActions } from "./editor-context";

export const fieldDomId = (fieldId: string) => `field-${fieldId}`;
const moveButtonId = (fieldId: string, delta: -1 | 1) =>
	`${fieldDomId(fieldId)}-move-${delta < 0 ? "up" : "down"}`;

/** 이동하면 카드가 다른 페이지 목록으로 다시 마운트되므로, 같은 버튼으로 포커스를 되돌린다 */
function refocus(id: string): void {
	requestAnimationFrame(() => document.getElementById(id)?.focus());
}

function ReferenceList({
	refs,
	locked,
}: {
	refs: readonly string[];
	locked: boolean;
}) {
	return (
		<div className="space-y-2">
			{refs.length > 0 ? (
				<>
					<p>이 질문을 쓰는 아래 설정도 함께 해제됩니다.</p>
					<ul className="list-disc pl-5">
						{refs.map((ref) => (
							<li key={ref}>{ref}</li>
						))}
					</ul>
				</>
			) : (
				<p>이 질문을 참조하는 설정은 없습니다.</p>
			)}
			{locked && (
				<p>
					이미 발행된 질문입니다. 다음 발행부터 빠지며, 기존 응답의 시트 열은
					그대로 남습니다.
				</p>
			)}
		</div>
	);
}

/** 삭제 확인: 열 때 계산한 참조 목록(refs)으로 "무엇이 같이 사라지는지" 보여준다 */
function DeleteDialog({
	field,
	refs,
	onClose,
}: {
	field: FieldDef;
	refs: readonly string[];
	onClose: () => void;
}) {
	const { dispatch, announce, lockedFieldIds } = useEditorActions();
	const remove = () => {
		dispatch({ type: "field/remove", fieldId: field.id });
		announce(`"${field.label}" 질문을 삭제했습니다`);
	};
	return (
		<AlertDialog onOpenChange={(open) => !open && onClose()} open>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{`"${field.label}" 질문을 삭제할까요?`}</AlertDialogTitle>
					<AlertDialogDescription render={<div />}>
						<ReferenceList locked={lockedFieldIds.has(field.id)} refs={refs} />
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>취소</AlertDialogCancel>
					<AlertDialogAction
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						onClick={remove}
					>
						삭제
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

interface CardActionsProps {
	canMoveDown: boolean;
	canMoveUp: boolean;
	field: FieldDef;
}

/** 이동/복제 명령. 최신 정의는 이벤트 시점에 읽는다 (렌더 중 구독하지 않음 → 카드 리렌더 없음) */
function useFieldCommands(field: FieldDef) {
	const { dispatch, getDefinition, announce } = useEditorActions();
	const name = `"${field.label}"`;
	const move = (delta: -1 | 1) => {
		const target = moveTarget(getDefinition(), field.id, delta);
		if (target) {
			dispatch({ type: "field/move", fieldId: field.id, ...target });
			announce(`${name}을(를) ${delta < 0 ? "위로" : "아래로"} 옮겼습니다`);
			refocus(moveButtonId(field.id, delta));
		}
	};
	const duplicate = () => {
		dispatch({
			type: "field/duplicate",
			fieldId: field.id,
			newId: nextFieldId(getDefinition()),
		});
		announce(`${name} 질문을 복제했습니다`);
	};
	/** 삭제 확인 창을 여는 시점의 참조 목록 (창이 열려 있는 동안 고정) */
	const referencesNow = () => referencesTo(getDefinition(), field.id);
	return { name, move, duplicate, referencesNow };
}

export function FieldCardActions({
	field,
	canMoveUp,
	canMoveDown,
}: CardActionsProps) {
	const { name, move, duplicate, referencesNow } = useFieldCommands(field);
	/** null = 삭제 확인 창 닫힘 */
	const [deleteRefs, setDeleteRefs] = useState<readonly string[] | null>(null);
	return (
		<div className="flex shrink-0">
			<IconButton
				disabled={!canMoveUp}
				icon={ArrowUp}
				id={moveButtonId(field.id, -1)}
				label={`${name} 위로 이동`}
				onClick={() => move(-1)}
			/>
			<IconButton
				disabled={!canMoveDown}
				icon={ArrowDown}
				id={moveButtonId(field.id, 1)}
				label={`${name} 아래로 이동`}
				onClick={() => move(1)}
			/>
			<IconButton icon={Copy} label={`${name} 복제`} onClick={duplicate} />
			<IconButton
				icon={Trash2}
				label={`${name} 삭제`}
				onClick={() => setDeleteRefs(referencesNow())}
			/>
			{deleteRefs && (
				<DeleteDialog
					field={field}
					onClose={() => setDeleteRefs(null)}
					refs={deleteRefs}
				/>
			)}
		</div>
	);
}
