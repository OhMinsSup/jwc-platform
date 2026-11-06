import { DEFINITION_LIMITS } from "@jwc/form-core/definition/definition";
import type { ChoiceOption } from "@jwc/form-core/definition/fields";
import { CommitInput } from "@jwc/ui-patterns/components/form-controls";
import { IconButton } from "@jwc/ui-patterns/components/pickers";
import { Button } from "@jwc/ui/components/button";
import { Input } from "@jwc/ui/components/input";
import { Label } from "@jwc/ui/components/label";
import { Switch } from "@jwc/ui/components/switch";
import { Textarea } from "@jwc/ui/components/textarea";
import { ArrowDown, ArrowUp, ListPlus, Plus, Trash2 } from "lucide-react";
import { memo, useId, useState } from "react";

import { useEditorActions } from "./editor-context";

interface OptionRowProps {
	count: number;
	fieldId: string;
	index: number;
	option: ChoiceOption;
	showDetails: boolean;
}

function OptionInputs({
	fieldId,
	option,
	index,
	showDetails,
}: Omit<OptionRowProps, "count">) {
	const { dispatch } = useEditorActions();
	const n = index + 1;
	const update = (patch: { label?: string; description?: string }) =>
		dispatch({ type: "option/update", fieldId, index, patch });
	return (
		<div className="grid gap-2 sm:grid-cols-[1fr_auto]">
			<Input
				aria-label={`선택지 ${n} 이름`}
				onChange={(e) => update({ label: e.target.value })}
				placeholder={`선택지 ${n}`}
				value={option.label}
			/>
			{showDetails && (
				<CommitInput
					aria-label={`선택지 ${n} 저장 값`}
					className="font-mono text-xs sm:w-36"
					onCommit={(to) =>
						dispatch({ type: "option/rename", fieldId, from: option.value, to })
					}
					value={option.value}
				/>
			)}
			{showDetails && (
				<Input
					aria-label={`선택지 ${n} 설명`}
					className="sm:col-span-2"
					onChange={(e) => update({ description: e.target.value || undefined })}
					placeholder="설명 (카드 표시 방식에서 보입니다)"
					value={option.description ?? ""}
				/>
			)}
		</div>
	);
}

/** 선택지 한 줄. 같은 option 객체면 리렌더하지 않는다 (긴 목록에서 타이핑 비용을 한 줄로 제한) */
const OptionRow = memo(function OptionRowView(props: OptionRowProps) {
	const { fieldId, option, index, count } = props;
	const { dispatch, announce } = useEditorActions();
	const name = `"${option.label || `선택지 ${index + 1}`}"`;
	const move = (to: number) => {
		dispatch({ type: "option/move", fieldId, from: index, to });
		announce(`${name}을(를) ${to + 1}번째로 옮겼습니다`);
	};
	const remove = () => {
		dispatch({ type: "option/remove", fieldId, value: option.value });
		announce(`${name}을(를) 삭제했습니다`);
	};
	return (
		<li className="grid grid-cols-[1fr_auto] items-start gap-2">
			<OptionInputs {...props} />
			<div className="flex">
				<IconButton
					disabled={index === 0}
					icon={ArrowUp}
					label={`${name} 위로`}
					onClick={() => move(index - 1)}
				/>
				<IconButton
					disabled={index === count - 1}
					icon={ArrowDown}
					label={`${name} 아래로`}
					onClick={() => move(index + 1)}
				/>
				<IconButton
					disabled={count <= 1}
					icon={Trash2}
					label={`${name} 삭제`}
					onClick={remove}
				/>
			</div>
		</li>
	);
});

const LINE_BREAK = /\r?\n/u;

function BulkAdd({ fieldId, onDone }: { fieldId: string; onDone: () => void }) {
	const { dispatch, announce } = useEditorActions();
	const [text, setText] = useState("");
	const inputId = useId();
	const labels = text
		.split(LINE_BREAK)
		.map((line) => line.trim())
		.filter(Boolean);
	const add = () => {
		dispatch({ type: "option/add", fieldId, labels });
		announce(`선택지 ${labels.length}개를 추가했습니다`);
		setText("");
		onDone();
	};
	return (
		<div className="space-y-2 rounded-md border border-dashed p-3">
			<Label htmlFor={inputId}>한 줄에 하나씩 입력</Label>
			<Textarea
				id={inputId}
				onChange={(event) => setText(event.target.value)}
				rows={5}
				value={text}
			/>
			<div className="flex justify-end gap-2">
				<Button onClick={onDone} size="sm" variant="ghost">
					취소
				</Button>
				<Button disabled={labels.length === 0} onClick={add} size="sm">
					{labels.length > 0 ? `${labels.length}개 추가` : "추가"}
				</Button>
			</div>
		</div>
	);
}

function AddOptionButtons({
	fieldId,
	count,
	onBulk,
}: {
	fieldId: string;
	count: number;
	onBulk: () => void;
}) {
	const { dispatch } = useEditorActions();
	const full = count >= DEFINITION_LIMITS.options;
	return (
		<div className="flex flex-wrap gap-2">
			<Button
				disabled={full}
				onClick={() =>
					dispatch({
						type: "option/add",
						fieldId,
						labels: [`선택지 ${count + 1}`],
					})
				}
				size="sm"
				variant="outline"
			>
				<Plus aria-hidden className="mr-1 h-4 w-4" />
				선택지 추가
			</Button>
			<Button disabled={full} onClick={onBulk} size="sm" variant="ghost">
				<ListPlus aria-hidden className="mr-1 h-4 w-4" />
				여러 개 붙여넣기
			</Button>
		</div>
	);
}

function OptionsHeader({
	count,
	showDetails,
	onShowDetails,
}: {
	count: number;
	showDetails: boolean;
	onShowDetails: (on: boolean) => void;
}) {
	const detailsId = useId();
	return (
		<div className="flex items-center justify-between gap-2">
			<span aria-hidden className="text-sm font-medium">
				선택지 <span className="text-muted-foreground">({count})</span>
			</span>
			<div className="flex items-center gap-2">
				<Switch
					checked={showDetails}
					id={detailsId}
					onCheckedChange={onShowDetails}
				/>
				<Label className="text-muted-foreground text-xs" htmlFor={detailsId}>
					설명 · 저장 값 편집
				</Label>
			</div>
		</div>
	);
}

export function OptionsEditor({
	fieldId,
	options,
}: {
	fieldId: string;
	options: readonly ChoiceOption[];
}) {
	const [showDetails, setShowDetails] = useState(false);
	const [bulk, setBulk] = useState(false);
	return (
		<fieldset className="space-y-3">
			<legend className="sr-only">선택지 {options.length}개</legend>
			<OptionsHeader
				count={options.length}
				onShowDetails={setShowDetails}
				showDetails={showDetails}
			/>
			<ol className="space-y-2">
				{options.map((option, index) => (
					<OptionRow
						count={options.length}
						fieldId={fieldId}
						index={index}
						key={option.value}
						option={option}
						showDetails={showDetails}
					/>
				))}
			</ol>
			{bulk ? (
				<BulkAdd fieldId={fieldId} onDone={() => setBulk(false)} />
			) : (
				<AddOptionButtons
					count={options.length}
					fieldId={fieldId}
					onBulk={() => setBulk(true)}
				/>
			)}
			{showDetails && (
				<p className="text-muted-foreground text-xs">
					저장 값은 조건과 선택지별 금액이 가리키는 키입니다. 바꾸면 그 참조도
					함께 바뀝니다. 시트에는 이름이 기록됩니다.
				</p>
			)}
		</fieldset>
	);
}
