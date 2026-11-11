import type { AnswerValue } from "@jwc/form-core/answers/value";
import type { FieldDef } from "@jwc/form-core/definition/fields";
import { Callout } from "@jwc/ui-patterns/components/callout";
import { Label } from "@jwc/ui/components/label";
import { memo, Suspense, useCallback } from "react";

import { FIELD_RENDERERS } from "./fields/registry";
import { useDraftStore } from "./store";

/** 폼 컨테이너가 조건을 다시 계산해도 답변·오류가 바뀐 질문만 다시 그린다. */
export const DraftField = memo(function DraftFieldView({
	field,
	slug,
	error,
}: {
	field: FieldDef;
	slug: string;
	error: string | undefined;
}) {
	const value = useDraftStore((state) => state.drafts[slug]?.[field.id]);
	const setAnswer = useDraftStore((state) => state.setAnswer);
	const onChange = useCallback(
		(next: AnswerValue | undefined) => setAnswer(slug, field.id, next),
		[setAnswer, slug, field.id],
	);
	return (
		<FieldView field={field} value={value} error={error} onChange={onChange} />
	);
});

interface FieldViewProps {
	error?: string;
	field: FieldDef;
	onChange: (value: AnswerValue | undefined) => void;
	value: AnswerValue | undefined;
}

const INPUT_LOADING = (
	<output className="block min-h-12" aria-label="입력 항목을 불러오는 중" />
);

/** 라벨/설명/오류 표시는 모든 타입에 공통, 입력부만 레지스트리에서 고른다 */
function FieldView({ field, value, error, onChange }: FieldViewProps) {
	const Renderer = FIELD_RENDERERS[field.type];
	const inputId = `field-${field.id}`;
	const errorId = `${inputId}-error`;

	if (!Renderer) {
		return (
			<Callout title={field.label} tone="info">
				{field.description && (
					<p className="text-muted-foreground whitespace-pre-line">
						{field.description}
					</p>
				)}
			</Callout>
		);
	}

	return (
		<div aria-describedby={error ? errorId : undefined} className="space-y-3">
			<div className="space-y-1">
				{/* 띄어쓰기 없는 긴 제목도 줄을 바꾼다 (Label은 flex라 그대로면 최소 폭이 제목 전체가 된다) */}
				<Label
					className="gap-0.5 text-[15px] font-semibold [overflow-wrap:anywhere]"
					htmlFor={inputId}
				>
					{field.label}
					{field.required && <span className="text-destructive">*</span>}
				</Label>
				{field.description && (
					<p className="text-muted-foreground text-sm whitespace-pre-line">
						{field.description}
					</p>
				)}
			</div>
			<Suspense fallback={INPUT_LOADING}>
				<Renderer
					field={field}
					inputId={inputId}
					invalid={Boolean(error)}
					onChange={onChange}
					value={value}
				/>
			</Suspense>
			{error && (
				<p className="text-destructive text-sm" id={errorId} role="alert">
					{error}
				</p>
			)}
		</div>
	);
}
