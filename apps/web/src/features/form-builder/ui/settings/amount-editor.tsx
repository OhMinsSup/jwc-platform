import type {
	FormDefinition,
	PaymentDef,
} from "@jwc/form-core/definition/definition";
import type { FieldDef } from "@jwc/form-core/definition/fields";
import {
	FormRow,
	NumberInput,
} from "@jwc/ui-patterns/components/form-controls";
import { Label } from "@jwc/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@jwc/ui/components/radio-group";
import { useId, useMemo } from "react";

import { anchorChoices, PAYMENT_TYPES } from "../../model/derive";
import { useEditorActions, useEditorIndex } from "../editor-context";
import { AnchorSelect } from "./shared";

type Amount = PaymentDef["amount"];

type ByOption = Extract<Amount, { kind: "byOption" }>;

/** 선택지 이름 칸. 띄어쓰기 없는 긴 이름도 줄을 바꿔 표가 화면 밖으로 넓어지지 않게 한다 */
const OPTION_LABEL_CELL =
	"py-2 pr-3 text-left font-normal [overflow-wrap:anywhere]";

/** 금액 하나 설정/해제. 빈칸은 키를 지워 "옵션 금액 누락" 검증이 잡도록 한다 */
function withOptionAmount(
	amount: ByOption,
	value: string,
	won: number | undefined,
): ByOption {
	const { [value]: _old, ...rest } = amount.amounts;
	return {
		...amount,
		amounts: won === undefined ? rest : { ...rest, [value]: won },
	};
}

function OptionAmounts({
	field,
	amount,
}: {
	field: FieldDef | undefined;
	amount: ByOption;
}) {
	const { dispatch } = useEditorActions();
	if (!(field && "options" in field)) {
		return null;
	}
	const setAmount = (value: string, won: number | undefined) =>
		dispatch({
			type: "payment/update",
			patch: { amount: withOptionAmount(amount, value, won) },
		});
	return (
		<table className="w-full text-sm">
			<caption className="sr-only">선택지별 금액</caption>
			<thead>
				<tr className="text-muted-foreground text-left text-xs">
					<th className="pb-2 font-medium">선택지</th>
					<th className="w-44 pb-2 font-medium">금액 (원)</th>
				</tr>
			</thead>
			<tbody className="divide-y">
				{field.options.map((option) => (
					<tr key={option.value}>
						<th className={OPTION_LABEL_CELL} scope="row">
							{option.label}
						</th>
						<td className="py-2">
							<NumberInput
								aria-invalid={amount.amounts[option.value] === undefined}
								aria-label={`${option.label} 금액`}
								min={0}
								onValueChange={(won) => setAmount(option.value, won)}
								placeholder="입력 필요"
								step={1000}
								value={amount.amounts[option.value]}
							/>
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}

/** 금액 방식 → 라벨과 전환 시 초기값. 라디오 버튼은 이 표에서 그린다 */
const AMOUNT_KINDS: readonly {
	kind: Amount["kind"];
	label: string;
	initial: Amount;
}[] = [
	{
		kind: "fixed",
		label: "모두 같은 금액",
		initial: { kind: "fixed", value: 0 },
	},
	{
		kind: "byOption",
		label: "선택지에 따라 다름",
		initial: { kind: "byOption", fieldId: "", amounts: {} },
	},
];

function AmountKindRadio({
	value,
	onChange,
}: {
	value: Amount["kind"];
	onChange: (next: Amount) => void;
}) {
	const groupId = useId();
	return (
		<RadioGroup
			aria-label="금액 방식"
			className="flex flex-wrap gap-4"
			onValueChange={(kind) => {
				const next = AMOUNT_KINDS.find((entry) => entry.kind === kind);
				if (next) {
					onChange(next.initial);
				}
			}}
			value={value}
		>
			{AMOUNT_KINDS.map(({ kind, label }) => (
				<div className="flex items-center gap-2" key={kind}>
					<RadioGroupItem id={`${groupId}-${kind}`} value={kind} />
					<Label htmlFor={`${groupId}-${kind}`}>{label}</Label>
				</div>
			))}
		</RadioGroup>
	);
}

function ByOptionAmount({
	definition,
	amount,
	onChange,
}: {
	definition: FormDefinition;
	amount: ByOption;
	onChange: (next: Amount) => void;
}) {
	const index = useEditorIndex();
	const choices = useMemo(
		() => anchorChoices(definition, index, PAYMENT_TYPES),
		[definition, index],
	);
	return (
		<>
			<AnchorSelect
				choices={choices}
				hint="객관식(하나 선택) 중 필수이고 조건 없이 항상 보이는 질문"
				label="금액 기준 질문"
				onChange={(fieldId) =>
					onChange({
						kind: "byOption",
						fieldId,
						amounts: fieldId === amount.fieldId ? amount.amounts : {},
					})
				}
				value={amount.fieldId}
			/>
			<OptionAmounts amount={amount} field={index.byId.get(amount.fieldId)} />
		</>
	);
}

export function AmountEditor({
	definition,
	amount,
}: {
	definition: FormDefinition;
	amount: Amount;
}) {
	const { dispatch } = useEditorActions();
	const setAmount = (next: Amount) =>
		dispatch({ type: "payment/update", patch: { amount: next } });
	return (
		<div className="space-y-4">
			<AmountKindRadio onChange={setAmount} value={amount.kind} />
			{amount.kind === "fixed" ? (
				<FormRow label="금액 (원)">
					{(ids) => (
						<NumberInput
							className="w-48"
							id={ids.inputId}
							min={0}
							onValueChange={(value) =>
								setAmount({ kind: "fixed", value: value ?? 0 })
							}
							step={1000}
							value={amount.value}
						/>
					)}
				</FormRow>
			) : (
				<ByOptionAmount
					amount={amount}
					definition={definition}
					onChange={setAmount}
				/>
			)}
		</div>
	);
}
