import { Button } from "@jwc/ui/components/button";
import { Input } from "@jwc/ui/components/input";
import { Label } from "@jwc/ui/components/label";
import { Bell, Loader2, Sheet, Split } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import type { ReactNode, SubmitEvent } from "react";

import { formText } from "../lib/form-data";

interface AuthFieldDef {
	autoComplete: string;
	hint?: string;
	label: string;
	name: string;
	type: "text" | "email" | "password";
}

interface AuthCardProps {
	description?: string;
	fields: AuthFieldDef[];
	footer?: ReactNode;
	/** 실패 시 사용자에게 보여줄 메시지를 반환, 성공 시 null */
	onSubmit: (values: Record<string, string>) => Promise<string | null>;
	submitLabel: string;
	title: string;
}

/** 브랜드 패널에 보여줄 기능 소개 (표로 관리) */
const HIGHLIGHTS: readonly { icon: LucideIcon; title: string; text: string }[] =
	[
		{
			icon: Split,
			title: "조건 분기",
			text: "답에 따라 질문과 페이지가 바뀝니다",
		},
		{
			icon: Sheet,
			title: "시트 연동",
			text: "응답이 구글 시트에 바로 쌓입니다",
		},
		{
			icon: Bell,
			title: "문자 알림",
			text: "신청 확인과 미입금 안내를 자동으로",
		},
	];

function BrandPanel() {
	return (
		<aside className="bg-brand text-brand-foreground relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
			<div
				aria-hidden
				className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10"
			/>
			<div
				aria-hidden
				className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/5"
			/>
			<p className="relative flex items-center gap-2.5 font-semibold">
				<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-sm font-bold">
					J
				</span>
				JWC Forms
			</p>
			<div className="relative space-y-8">
				<h2 className="max-w-sm text-3xl leading-tight font-bold text-balance">
					청년부 신청서를 만들고, 응답과 회비를 한곳에서.
				</h2>
				<ul className="space-y-4">
					{HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
						<li className="flex items-start gap-3" key={title}>
							<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
								<Icon aria-hidden className="h-4 w-4" />
							</span>
							<span>
								<span className="block text-sm font-medium">{title}</span>
								<span className="block text-sm opacity-80">{text}</span>
							</span>
						</li>
					))}
				</ul>
			</div>
			<p className="relative text-xs opacity-70">죽전우리교회 청년부</p>
		</aside>
	);
}

function AuthField({ field }: { field: AuthFieldDef }) {
	const hintId = `${field.name}-hint`;
	return (
		<div className="space-y-1.5">
			<Label htmlFor={field.name}>{field.label}</Label>
			<Input
				aria-describedby={field.hint ? hintId : undefined}
				autoComplete={field.autoComplete}
				className="h-11"
				id={field.name}
				name={field.name}
				required
				type={field.type}
			/>
			{field.hint && (
				<p className="text-muted-foreground text-xs" id={hintId}>
					{field.hint}
				</p>
			)}
		</div>
	);
}

function AuthError({ message }: { message: string | null }) {
	return message ? (
		<p
			className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm"
			role="alert"
		>
			{message}
		</p>
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
		<div className="space-y-1.5">
			<span
				aria-hidden
				className="bg-brand text-brand-foreground mb-6 flex h-10 w-10 items-center justify-center rounded-xl font-bold lg:hidden"
			>
				J
			</span>
			<h1 className="text-2xl font-bold tracking-tight">{title}</h1>
			{description && (
				<p className="text-muted-foreground text-sm">{description}</p>
			)}
		</div>
	);
}

/** 로그인/가입 화면 공용. 필드 목록을 데이터로 받는다. */
export function AuthCard({
	title,
	description,
	fields,
	submitLabel,
	footer,
	onSubmit,
}: AuthCardProps) {
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);
	async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		const data = new FormData(event.currentTarget);
		const values = Object.fromEntries(
			fields.map((field) => [field.name, formText(data, field.name)]),
		);
		setPending(true);
		setError(await onSubmit(values));
		setPending(false);
	}
	return (
		<div className="bg-canvas grid min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
			<BrandPanel />
			<main className="flex items-center justify-center px-4 py-12">
				<form className="w-full max-w-sm space-y-6" onSubmit={handleSubmit}>
					<AuthHeading description={description} title={title} />
					<div className="space-y-4">
						{fields.map((field) => (
							<AuthField field={field} key={field.name} />
						))}
					</div>
					<AuthError message={error} />
					<Button className="h-11 w-full" disabled={pending} type="submit">
						{pending && (
							<Loader2 aria-hidden className="h-4 w-4 animate-spin" />
						)}
						{submitLabel}
					</Button>
					{footer}
				</form>
			</main>
		</div>
	);
}
