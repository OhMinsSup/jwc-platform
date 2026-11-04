import { DEFINITION_LIMITS } from "@jwc/form-core/definition/definition";
import type { FormDefinition } from "@jwc/form-core/definition/definition";
import { isDisplayOnly } from "@jwc/form-core/definition/fields";
import { BUILTIN_TEMPLATE_KEYS } from "@jwc/form-core/definition/reserved";
import { FormRow } from "@jwc/ui-patterns/components/form-controls";
import type { FieldIds } from "@jwc/ui-patterns/components/form-controls";
import { LabeledSwitch } from "@jwc/ui-patterns/components/pickers";
import { Button } from "@jwc/ui/components/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@jwc/ui/components/select";
import { Textarea } from "@jwc/ui/components/textarea";
import { useMemo, useRef } from "react";
import type { ReactNode } from "react";

import type { FieldChoice } from "../../model/derive";
import type { SettingsSection } from "../../model/issues";

/** "첫 오류로 이동"이 스크롤할 설정 카드의 DOM id */
export const settingsDomId = (section: SettingsSection) =>
	`settings-${section}`;

interface AnchorSelectProps {
	choices: readonly FieldChoice[];
	hint?: string;
	label: string;
	onChange: (fieldId: string) => void;
	value: string;
}

/** 기준 질문 목록. 고를 수 없는 질문은 비활성화하고 이유를 옆에 적는다 */
function AnchorOptions({ choices }: { choices: readonly FieldChoice[] }) {
	return (
		<SelectContent>
			{choices.map(({ field, disabledReason }) => (
				<SelectItem
					disabled={Boolean(disabledReason)}
					key={field.id}
					value={field.id}
				>
					{field.label}
					{disabledReason && (
						<span className="text-muted-foreground ml-2 text-xs">
							({disabledReason})
						</span>
					)}
				</SelectItem>
			))}
		</SelectContent>
	);
}

/** 기준 질문 선택. 무결성 규칙에 안 맞는 질문은 이유와 함께 비활성화되어 고를 수 없다 */
export function AnchorSelect({
	label,
	hint,
	choices,
	value,
	onChange,
}: AnchorSelectProps) {
	const current = choices.find((choice) => choice.field.id === value);
	const error =
		value && !current
			? "선택했던 질문이 없어졌습니다. 다시 선택해주세요"
			: undefined;
	return (
		<FormRow
			error={error}
			hint={choices.length === 0 ? "조건에 맞는 질문이 아직 없습니다" : hint}
			label={label}
		>
			{(ids) => (
				<Select
					items={choices.map(({ field }) => ({
						value: field.id,
						label: field.label,
					}))}
					onValueChange={(next) => {
						if (next !== null) {
							onChange(next);
						}
					}}
					value={current ? value : null}
				>
					<SelectTrigger
						aria-describedby={ids.describedBy}
						aria-invalid={ids.invalid || !current}
						className="w-full"
						id={ids.inputId}
					>
						<SelectValue placeholder="질문 선택" />
					</SelectTrigger>
					<AnchorOptions choices={choices} />
				</Select>
			)}
		</FormRow>
	);
}

const BUILTIN_LABELS: Record<(typeof BUILTIN_TEMPLATE_KEYS)[number], string> = {
	title: "폼 제목",
	amount: "금액",
	account: "입금 계좌",
	link: "응답 확인 링크",
	submission_id: "응답 ID",
};

interface TemplateEditorProps {
	definition: FormDefinition;
	error?: string;
	label: string;
	onChange: (value: string) => void;
	value: string;
}

function VariableButtons({
	definition,
	onInsert,
}: {
	definition: FormDefinition;
	onInsert: (key: string) => void;
}) {
	const variables = useMemo(
		() => [
			...definition.fields
				.filter((field) => !isDisplayOnly(field))
				.map((field) => ({ key: field.id, label: field.label })),
			...BUILTIN_TEMPLATE_KEYS.map((key) => ({
				key,
				label: BUILTIN_LABELS[key],
			})),
		],
		[definition.fields],
	);
	return (
		<fieldset className="flex flex-wrap gap-1.5">
			<legend className="sr-only">변수 넣기</legend>
			{variables.map((variable) => (
				<Button
					className="h-7 rounded-full px-2.5 text-xs"
					key={variable.key}
					onClick={() => onInsert(variable.key)}
					title={`{{${variable.key}}}`}
					type="button"
					variant="secondary"
				>
					+ {variable.label || variable.key}
				</Button>
			))}
		</fieldset>
	);
}

/** 알림 문구. 변수는 직접 타이핑하지 않고 버튼으로 커서 위치에 넣는다 (오타로 빈 값이 나가는 것 방지) */
export function TemplateEditor({
	label,
	value,
	definition,
	onChange,
	error,
}: TemplateEditorProps) {
	const ref = useRef<HTMLTextAreaElement>(null);
	const insert = (key: string) => {
		const el = ref.current;
		const token = `{{${key}}}`;
		const start = el?.selectionStart ?? value.length;
		const end = el?.selectionEnd ?? value.length;
		onChange(value.slice(0, start) + token + value.slice(end));
		requestAnimationFrame(() => {
			el?.focus();
			el?.setSelectionRange(start + token.length, start + token.length);
		});
	};
	return (
		<FormRow
			error={error}
			hint={`${value.length} / ${DEFINITION_LIMITS.templateLength}자`}
			label={label}
		>
			{(ids: FieldIds) => (
				<div className="space-y-2">
					<Textarea
						aria-describedby={ids.describedBy}
						aria-invalid={ids.invalid}
						className="font-mono text-sm"
						id={ids.inputId}
						maxLength={DEFINITION_LIMITS.templateLength}
						onChange={(event) => onChange(event.target.value)}
						ref={ref}
						rows={5}
						value={value}
					/>
					<VariableButtons definition={definition} onInsert={insert} />
				</div>
			)}
		</FormRow>
	);
}

interface ToggleCardProps {
	/** undefined면 스위치를 숨긴다 (선행 조건이 안 맞을 때) */
	checked: boolean | undefined;
	children?: ReactNode;
	hint: string;
	onChange: (on: boolean) => void;
	title: string;
}

/** 설정 카드 안의 "켜면 내용이 펼쳐지는" 하위 기능 블록 */
export function ToggleCard({
	title,
	hint,
	checked,
	onChange,
	children,
}: ToggleCardProps) {
	return (
		<div className="space-y-4 rounded-xl border p-4">
			<div className="flex items-center justify-between gap-2">
				<div>
					<p className="text-sm font-medium">{title}</p>
					<p className="text-muted-foreground text-xs">{hint}</p>
				</div>
				{checked !== undefined && (
					<LabeledSwitch checked={checked} label="보내기" onChange={onChange} />
				)}
			</div>
			{checked && children}
		</div>
	);
}
