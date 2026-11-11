import { FIELD_ID_PATTERN } from "@jwc/form-core/definition/fields";
import type { FieldDef } from "@jwc/form-core/definition/fields";
import { fieldSheetColumns } from "@jwc/form-core/field-types/values";
import {
	CommitInput,
	Disclosure,
	FormRow,
} from "@jwc/ui-patterns/components/form-controls";
import { Input } from "@jwc/ui/components/input";
import { Lock } from "lucide-react";
import { useState } from "react";

import type { FieldPatch } from "../model/actions";
import { FIELD_CATALOG } from "../model/field-catalog";
import { useEditorActions } from "./editor-context";

/** 질문 ID: 템플릿 변수/답변 키. 확정 시점에만 바꾸고, 형식·중복을 먼저 확인한다 */
function IdInput({ field }: { field: FieldDef }) {
	const { dispatch, getDefinition, lockedFieldIds } = useEditorActions();
	const [error, setError] = useState<string>();
	const locked = lockedFieldIds.has(field.id);
	const commit = (to: string) => {
		if (!FIELD_ID_PATTERN.test(to)) {
			setError(
				"영문 소문자로 시작하고 소문자·숫자·_ 만 쓸 수 있습니다 (최대 40자)",
			);
			return;
		}
		if (getDefinition().fields.some((f) => f.id === to)) {
			setError("이미 다른 질문이 쓰는 ID입니다");
			return;
		}
		setError(undefined);
		dispatch({ type: "field/rename", from: field.id, to });
	};
	const hint = locked
		? "발행된 질문이라 바꿀 수 없습니다 (기존 응답과 알림 변수가 이 ID를 씁니다)"
		: `알림 문구에서 {{${field.id}}}로 씁니다. 바꾸면 조건·알림의 참조도 함께 바뀝니다.`;
	return (
		<FormRow error={error} hint={hint} label="질문 ID">
			{(ids) => (
				<div className="relative">
					<CommitInput
						aria-describedby={ids.describedBy}
						aria-invalid={ids.invalid}
						className="font-mono"
						disabled={locked}
						id={ids.inputId}
						onCommit={commit}
						value={field.id}
					/>
					{locked && (
						<Lock
							aria-hidden
							className="text-muted-foreground absolute top-3 right-3 h-4 w-4"
						/>
					)}
				</div>
			)}
		</FormRow>
	);
}

type Patch = (patch: FieldPatch) => void;

/** 시트 열 이름 안내. 일시처럼 시트에서 여러 열로 나뉘는 질문은 실제로 생길 열 이름을 보여 준다 */
function columnHeaderHint(field: FieldDef): string {
	const created = fieldSheetColumns(field).filter(
		(column) => !column.legacyOnly,
	);
	if (created.length <= 1) {
		return "비우면 질문 제목을 씁니다";
	}
	const names = created.map((column) => `'${column.header}'`).join("·");
	return `비우면 질문 제목을 씁니다. 시트에는 ${names} 열로 나뉩니다`;
}

/** 비워 두면 기본값을 쓰는 선택 텍스트 속성 (표로 기술) */
const OPTIONAL_TEXTS: readonly {
	key: "columnHeader" | "placeholder";
	label: string;
	hint?: (field: FieldDef) => string;
	/** 이 유형에서 보여줄지 */
	shows: (field: FieldDef) => boolean;
}[] = [
	{
		key: "columnHeader",
		label: "시트 열 이름",
		hint: columnHeaderHint,
		shows: () => true,
	},
	{
		key: "placeholder",
		label: "입력 예시 (placeholder)",
		shows: (field) => FIELD_CATALOG[field.type].hasPlaceholder,
	},
];

export function AdvancedSettings({
	field,
	onPatch,
}: {
	field: FieldDef;
	onPatch: Patch;
}) {
	return (
		<Disclosure
			contentClassName="mt-3 grid gap-4 sm:grid-cols-2"
			label="고급 설정"
		>
			<IdInput field={field} />
			{OPTIONAL_TEXTS.filter((spec) => spec.shows(field)).map((spec) => (
				<FormRow hint={spec.hint?.(field)} key={spec.key} label={spec.label}>
					{(ids) => (
						<Input
							aria-describedby={ids.describedBy}
							id={ids.inputId}
							onChange={(event) =>
								onPatch({ [spec.key]: event.target.value || undefined })
							}
							placeholder={
								spec.key === "columnHeader" ? field.label : undefined
							}
							value={field[spec.key] ?? ""}
						/>
					)}
				</FormRow>
			))}
		</Disclosure>
	);
}
