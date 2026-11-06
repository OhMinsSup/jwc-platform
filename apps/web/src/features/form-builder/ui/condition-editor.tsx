import { keysOf } from "@jwc/common/object";
import type { Condition } from "@jwc/form-core/definition/condition";
import type { FieldDef } from "@jwc/form-core/definition/fields";
import { ChoiceSelect, IconButton } from "@jwc/ui-patterns/components/pickers";
import { Button } from "@jwc/ui/components/button";
import { Plus, Split, X } from "lucide-react";
import { useId } from "react";

import {
	fromDraft,
	isRuleOp,
	opLabel,
	RULE_SPEC_BY_TYPE,
	ruleFor,
	toDraft,
	withOp,
} from "../model/conditions";
import type {
	ConditionDraft,
	ConditionRule,
	RuleJoin,
} from "../model/conditions";
import { RuleValueInput } from "./rule-value-input";

interface ConditionEditorProps {
	condition: Condition | undefined;
	onChange: (condition: Condition | undefined) => void;
	/** 조건에 쓸 수 있는 질문 (앞쪽 질문만) */
	sources: readonly FieldDef[];
	/** "이 질문" / "이 페이지" */
	subject: string;
}

const JOIN_LABELS: Record<RuleJoin, string> = {
	all: "모든 조건을 만족할 때",
	any: "조건 중 하나라도 만족할 때",
};

interface RuleRowProps {
	index: number;
	onChange: (rule: ConditionRule) => void;
	onRemove: () => void;
	rule: ConditionRule;
	sources: readonly FieldDef[];
}

const TRIGGER = "w-full bg-background";

/** 규칙 한 줄의 드롭다운 목록: 질문 후보, (질문 유형에 맞는) 비교 방식 */
function ruleRowChoices(
	sources: readonly FieldDef[],
	field: FieldDef | undefined,
) {
	return {
		fieldChoices: sources.map((source) => ({
			value: source.id,
			label: source.label,
		})),
		opChoices: field
			? RULE_SPEC_BY_TYPE[field.type].ops.map((op) => ({
					value: op,
					label: opLabel(op, field.type),
				}))
			: [],
	};
}

function RuleRow({ rule, index, sources, onChange, onRemove }: RuleRowProps) {
	const field = sources.find((source) => source.id === rule.fieldId);
	const n = index + 1;
	const { fieldChoices, opChoices } = ruleRowChoices(sources, field);
	const pickField = (id: string) => {
		const next = sources.find((source) => source.id === id);
		if (next) {
			onChange(ruleFor(next));
		}
	};
	return (
		<li className="bg-muted/40 flex flex-wrap items-center gap-2 rounded-md p-2">
			<ChoiceSelect
				choices={fieldChoices}
				className={`${TRIGGER} sm:w-56`}
				invalid={!field}
				label={`조건 ${n}: 질문`}
				onChange={pickField}
				placeholder="질문 선택 (앞쪽 질문만)"
				value={field ? rule.fieldId : undefined}
			/>
			{field && (
				<ChoiceSelect
					choices={opChoices}
					className={`${TRIGGER} sm:w-52`}
					label={`조건 ${n}: 비교 방식`}
					onChange={(op) => {
						if (isRuleOp(op)) {
							onChange(withOp(rule, op));
						}
					}}
					value={rule.op}
				/>
			)}
			{field && (
				<RuleValueInput
					field={field}
					label={`조건 ${n}: 값`}
					onChange={onChange}
					rule={rule}
				/>
			)}
			<span className="ml-auto">
				<IconButton icon={X} label={`조건 ${n} 삭제`} onClick={onRemove} />
			</span>
		</li>
	);
}

const JOIN_CHOICES = keysOf(JOIN_LABELS).map((join) => ({
	value: join,
	label: JOIN_LABELS[join],
}));

/** 닫힌 목록(JOIN_CHOICES)의 Select 값이므로 알 수 없는 값은 오지 않는다. 와도 무시한다 */
function isRuleJoin(value: unknown): value is RuleJoin {
	return typeof value === "string" && Object.hasOwn(JOIN_LABELS, value);
}

/** "이 질문을 [모든 조건을 만족할 때] 표시" 문장. 규칙이 하나면 결합 방식은 묻지 않는다 */
function JoinSentence({
	draft,
	subject,
	onJoin,
}: {
	draft: ConditionDraft;
	subject: string;
	onJoin: (join: RuleJoin) => void;
}) {
	const joinId = useId();
	if (draft.rules.length === 0) {
		return (
			<p className="text-muted-foreground text-sm">
				<Split aria-hidden className="mr-1 inline h-4 w-4" />
				{subject}은(는) 항상 표시됩니다.
			</p>
		);
	}
	return (
		<div className="flex flex-wrap items-center gap-2 text-sm">
			<span id={joinId}>{subject}을(를)</span>
			{draft.rules.length > 1 ? (
				<ChoiceSelect
					choices={JOIN_CHOICES}
					className="h-8 w-auto"
					labelledBy={joinId}
					onChange={(join) => {
						if (isRuleJoin(join)) {
							onJoin(join);
						}
					}}
					value={draft.join}
				/>
			) : (
				<span>다음 조건을 만족할 때</span>
			)}
			<span>표시</span>
		</div>
	);
}

function UnsupportedCondition({ onClear }: { onClear: () => void }) {
	return (
		<div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed p-3 text-sm">
			<span>편집기에서 표현할 수 없는 복잡한 조건이 설정되어 있습니다.</span>
			<Button onClick={onClear} size="sm" variant="outline">
				조건 지우기
			</Button>
		</div>
	);
}

/**
 * 표시 조건 편집기. 상태를 따로 갖지 않고 매 렌더마다 Condition → 편집 모델로 파생한다.
 * 편집기가 표현할 수 없는 조건(중첩 그룹)은 바꾸지 않고 "초기화"만 제공한다.
 */
function AddRuleButton({
	sources,
	subject,
	onAdd,
}: {
	sources: readonly FieldDef[];
	subject: string;
	onAdd: (rule: ConditionRule) => void;
}) {
	const [first] = sources;
	return (
		<>
			<Button
				disabled={!first}
				onClick={() => first && onAdd(ruleFor(first))}
				size="sm"
				variant="outline"
			>
				<Plus aria-hidden className="mr-1 h-4 w-4" />
				조건 추가
			</Button>
			{!first && (
				<p className="text-muted-foreground text-xs">
					조건은 {subject}보다 앞에 있는 질문의 답으로만 만들 수 있습니다.
				</p>
			)}
		</>
	);
}

export function ConditionEditor({
	condition,
	sources,
	onChange,
	subject,
}: ConditionEditorProps) {
	const draft = toDraft(condition);
	if (draft === null) {
		return <UnsupportedCondition onClear={() => onChange(undefined)} />;
	}
	const update = (rules: ConditionRule[], join?: RuleJoin) =>
		onChange(fromDraft({ join: join ?? draft.join, rules }));
	return (
		<div className="space-y-3">
			<JoinSentence
				draft={draft}
				onJoin={(join) => update(draft.rules, join)}
				subject={subject}
			/>
			{draft.rules.length > 0 && (
				<ol className="space-y-2">
					{draft.rules.map((rule, index) => (
						<RuleRow
							index={index}
							// oxlint-disable-next-line react/no-array-index-key -- rules are positional values without identity
							key={index}
							onChange={(next) =>
								update(draft.rules.map((r, i) => (i === index ? next : r)))
							}
							onRemove={() => update(draft.rules.filter((_, i) => i !== index))}
							rule={rule}
							sources={sources}
						/>
					))}
				</ol>
			)}
			<AddRuleButton
				onAdd={(rule) => update([...draft.rules, rule])}
				sources={sources}
				subject={subject}
			/>
		</div>
	);
}
