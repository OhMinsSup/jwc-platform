import type { AnswerValue, FieldDef } from "@jwc/form-core";
import { Label } from "@jwc/ui/components/label";

import { FIELD_RENDERERS } from "./fields/registry";

interface FieldViewProps {
	error?: string;
	field: FieldDef;
	onChange: (value: AnswerValue | undefined) => void;
	value: AnswerValue | undefined;
}

/** 라벨/설명/오류 표시는 모든 타입에 공통, 입력부만 레지스트리에서 고른다 */
export function FieldView({ field, value, error, onChange }: FieldViewProps) {
	const Renderer = FIELD_RENDERERS[field.type];
	const inputId = `field-${field.id}`;
	const errorId = `${inputId}-error`;

	if (!Renderer) {
		return (
			<div className="bg-muted/30 rounded-xl border p-4">
				<p className="font-medium">{field.label}</p>
				{field.description && (
					<p className="text-muted-foreground mt-1 text-sm whitespace-pre-line">
						{field.description}
					</p>
				)}
			</div>
		);
	}

	return (
		<div aria-describedby={error ? errorId : undefined} className="space-y-3">
			<div className="space-y-1">
				<Label className="text-sm font-medium" htmlFor={inputId}>
					{field.label}
					{field.required && <span className="text-destructive ml-1">*</span>}
				</Label>
				{field.description && (
					<p className="text-muted-foreground text-sm whitespace-pre-line">
						{field.description}
					</p>
				)}
			</div>
			<Renderer
				field={field}
				inputId={inputId}
				invalid={Boolean(error)}
				onChange={onChange}
				value={value}
			/>
			{error && (
				<p className="text-destructive text-sm" id={errorId} role="alert">
					{error}
				</p>
			)}
		</div>
	);
}
