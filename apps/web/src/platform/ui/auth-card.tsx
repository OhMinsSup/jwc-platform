import { formText } from "@jwc/common/form-data";
import { Callout } from "@jwc/ui-patterns/components/callout";
import { Button } from "@jwc/ui/components/button";
import { Field, FieldGroup } from "@jwc/ui/components/field";
import { Input } from "@jwc/ui/components/input";
import { Label } from "@jwc/ui/components/label";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import type { ReactNode, SubmitEvent } from "react";

import { TicketMark } from "./brand-mark";

export interface AuthFieldDef {
	autoComplete: string;
	hint?: string;
	label: string;
	minLength?: number;
	maxLength?: number;
	inputMode?: "numeric" | "text";
	pattern?: string;
	name: string;
	/** true면 비워 둘 수 있다 (기본: 필수) */
	optional?: boolean;
	type: "text" | "email" | "password" | "tel";
}

interface AuthCardProps {
	children?: ReactNode;
	description?: string;
	fields: AuthFieldDef[];
	footer?: ReactNode;
	/** 실패 시 사용자에게 보여줄 메시지를 반환, 성공 시 null */
	onSubmit: (values: Record<string, string>) => Promise<string | null>;
	submitLabel: string;
	title: string;
}

function AuthField({ field }: { field: AuthFieldDef }) {
	const hintId = `${field.name}-hint`;
	return (
		<Field>
			<Label
				className="text-muted-foreground gap-1 text-[13px] font-normal"
				htmlFor={field.name}
			>
				{field.label}
				{field.optional === true && (
					<span className="text-faint-foreground">(선택)</span>
				)}
			</Label>
			<Input
				aria-describedby={field.hint ? hintId : undefined}
				autoComplete={field.autoComplete}
				className="bg-card h-[38px] rounded-md px-3"
				id={field.name}
				minLength={field.minLength}
				maxLength={field.maxLength}
				inputMode={field.inputMode}
				pattern={field.pattern}
				name={field.name}
				required={field.optional !== true}
				type={field.type}
			/>
			{field.hint && (
				<p className="text-faint-foreground text-xs" id={hintId}>
					{field.hint}
				</p>
			)}
		</Field>
	);
}

function AuthError({ message }: { message: string | null }) {
	return message ? (
		<Callout role="alert" tone="danger">
			{message}
		</Callout>
	) : null;
}

function AuthHeading({
	title,
	description,
}: {
	title: string;
	description?: string;
}) {
	return (
		<div>
			<TicketMark className="text-foreground mx-auto mb-6 h-8 w-8" />
			<h1 className="text-2xl font-extrabold tracking-[-0.02em]">{title}</h1>
			{description && (
				<p className="text-muted-foreground mt-1 text-sm">{description}</p>
			)}
		</div>
	);
}

/**
 * 로그인/가입 화면 공용 (typie 로그인 구성): 모눈 바탕 가운데 400px 카드, 옅은 그림자, 표식 → 제목 → 입력 → 주 버튼.
 * 라벨 13px, 입력/버튼 38px. 필드 목록은 데이터로 받는다.
 */
export function AuthCard({
	title,
	description,
	fields,
	submitLabel,
	footer,
	onSubmit,
	children,
}: AuthCardProps) {
	const { error, pending, handleSubmit } = useAuthSubmission(fields, onSubmit);
	return (
		<main className="bg-grid flex min-h-svh items-center justify-center p-5">
			<div className="bg-card shadow-soft w-full max-w-[400px] rounded-xl px-6 py-10 sm:p-12">
				<form className="flex flex-col gap-6" onSubmit={handleSubmit}>
					<AuthHeading description={description} title={title} />
					{children}
					<FieldGroup>
						{fields.map((field) => (
							<AuthField field={field} key={field.name} />
						))}
					</FieldGroup>
					<AuthError message={error} />
					<Button
						className="shadow-soft-sm h-[38px] w-full font-semibold"
						disabled={pending}
						type="submit"
					>
						{pending && (
							<Loader2 aria-hidden className="h-4 w-4 animate-spin" />
						)}
						{submitLabel}
					</Button>
					{footer}
				</form>
			</div>
		</main>
	);
}

async function submitAuth(
	onSubmit: AuthCardProps["onSubmit"],
	values: Record<string, string>,
) {
	try {
		return await onSubmit(values);
	} catch (error) {
		if (!(error instanceof Error)) {
			throw error;
		}
		return "요청을 처리하지 못했습니다. 연결을 확인한 뒤 다시 시도해주세요";
	}
}

function useAuthSubmission(
	fields: AuthFieldDef[],
	onSubmit: AuthCardProps["onSubmit"],
) {
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);
	async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		if (pending) {
			return;
		}
		const data = new FormData(event.currentTarget);
		const values = Object.fromEntries(
			fields.map((field) => [field.name, formText(data, field.name)]),
		);
		setPending(true);
		setError(await submitAuth(onSubmit, values));
		setPending(false);
	}
	return { error, pending, handleSubmit };
}
