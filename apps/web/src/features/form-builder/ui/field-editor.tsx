import type { FieldDef } from "@jwc/form-core/definition/fields";
import { FormRow } from "@jwc/ui-patterns/components/form-controls";
import { LabeledSwitch } from "@jwc/ui-patterns/components/pickers";
import { Input } from "@jwc/ui/components/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@jwc/ui/components/select";
import { Textarea } from "@jwc/ui/components/textarea";
import { useEffect, useMemo, useRef } from "react";

import type { FieldPatch } from "../model/actions";
import { fieldConditionSources } from "../model/derive";
import {
	FIELD_CATALOG,
	FIELD_GROUPS,
	FIELD_TYPE_ORDER,
} from "../model/field-catalog";
import { AdvancedSettings } from "./advanced-settings";
import { ConditionEditor } from "./condition-editor";
import { useEditorActions, useEditorIndex } from "./editor-context";
import { OptionsEditor } from "./options-editor";
import { PropertyGrid } from "./property-grid";

type Patch = (patch: FieldPatch) => void;

const SUBHEADING =
	"font-medium text-muted-foreground text-xs uppercase tracking-wide";

/** 트리거에 유형 이름을 보여주기 위한 값 → 라벨 목록 (Base UI Select items) */
const TYPE_ITEMS = FIELD_TYPE_ORDER.map((type) => ({
	value: type,
	label: FIELD_CATALOG[type].label,
}));

function TypeSelect({ field, inputId }: { field: FieldDef; inputId: string }) {
	const { dispatch } = useEditorActions();
	return (
		<Select
			items={TYPE_ITEMS}
			onValueChange={(type) => {
				if (type !== null) {
					dispatch({
						type: "field/changeType",
						fieldId: field.id,
						fieldType: type,
					});
				}
			}}
			value={field.type}
		>
			<SelectTrigger className="w-full" id={inputId}>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{FIELD_GROUPS.map(({ group, label }) => (
					<SelectGroup key={group}>
						<SelectLabel>{label}</SelectLabel>
						{FIELD_TYPE_ORDER.filter(
							(type) => FIELD_CATALOG[type].group === group,
						).map((type) => (
							<SelectItem key={type} value={type}>
								{FIELD_CATALOG[type].label}
							</SelectItem>
						))}
					</SelectGroup>
				))}
			</SelectContent>
		</Select>
	);
}

/** 방금 추가된 질문이면 제목을 선택 상태로 포커스 → 바로 덮어쓰기 */
function TitleInput({
	field,
	onPatch,
	focusOnMount,
}: {
	field: FieldDef;
	onPatch: Patch;
	focusOnMount: boolean;
}) {
	const ref = useRef<HTMLInputElement>(null);
	useEffect(() => {
		if (focusOnMount) {
			ref.current?.select();
		}
	}, [focusOnMount]);
	return (
		<FormRow label={field.type === "statement" ? "안내 제목" : "질문 제목"}>
			{(ids) => (
				<Input
					className="font-medium"
					id={ids.inputId}
					onChange={(e) => onPatch({ label: e.target.value })}
					ref={ref}
					value={field.label}
				/>
			)}
		</FormRow>
	);
}

/** 모든 유형에 공통인 칸: 제목, 유형, 설명, 필수 */
function CommonFields(props: {
	field: FieldDef;
	onPatch: Patch;
	focusOnMount: boolean;
}) {
	const { field, onPatch } = props;
	const isStatement = field.type === "statement";
	return (
		<div className="grid gap-4 sm:grid-cols-[1fr_14rem]">
			<TitleInput {...props} />
			<FormRow label="유형">
				{(ids) => <TypeSelect field={field} inputId={ids.inputId} />}
			</FormRow>
			<FormRow
				className="sm:col-span-2"
				label={isStatement ? "안내 내용" : "설명 (선택)"}
			>
				{(ids) => (
					<Textarea
						id={ids.inputId}
						onChange={(e) =>
							onPatch({ description: e.target.value || undefined })
						}
						rows={isStatement ? 4 : 2}
						value={field.description ?? ""}
					/>
				)}
			</FormRow>
			{!isStatement && (
				<div className="sm:col-span-2">
					<LabeledSwitch
						checked={field.required}
						label="필수 질문"
						onChange={(required) => onPatch({ required })}
					/>
				</div>
			)}
		</div>
	);
}

function FieldCondition({
	field,
	onPatch,
}: {
	field: FieldDef;
	onPatch: Patch;
}) {
	const index = useEditorIndex();
	const sources = useMemo(
		() => fieldConditionSources(index, field.id),
		[index, field.id],
	);
	return (
		<section aria-label="표시 조건" className="space-y-2">
			<h4 className={SUBHEADING}>표시 조건</h4>
			<ConditionEditor
				condition={field.showIf}
				onChange={(showIf) => onPatch({ showIf })}
				sources={sources}
				subject="이 질문"
			/>
		</section>
	);
}

interface FieldEditorProps {
	field: FieldDef;
	/** 방금 추가된 질문이면 제목 칸에 포커스 */
	focusOnMount: boolean;
}

/** 펼친 카드의 본문. 위에서 아래로: 공통 → 선택지 → 유형별 세부 → 조건 → 고급 */
export function FieldEditor({ field, focusOnMount }: FieldEditorProps) {
	const { dispatch } = useEditorActions();
	const onPatch: Patch = (patch) =>
		dispatch({ type: "field/update", fieldId: field.id, patch });
	return (
		<div className="space-y-6">
			<CommonFields
				field={field}
				focusOnMount={focusOnMount}
				onPatch={onPatch}
			/>
			{"options" in field && (
				<OptionsEditor fieldId={field.id} options={field.options} />
			)}
			<PropertyGrid field={field} onPatch={onPatch} />
			<FieldCondition field={field} onPatch={onPatch} />
			<AdvancedSettings field={field} onPatch={onPatch} />
		</div>
	);
}
