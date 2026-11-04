import { Button } from "@jwc/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@jwc/ui/components/dialog";
import { Input } from "@jwc/ui/components/input";
import { Label } from "@jwc/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@jwc/ui/components/radio-group";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Plus } from "lucide-react";
import { useId, useState } from "react";
import type { SubmitEvent } from "react";

import { createFormFn } from "../../functions/admin";
import { formText } from "../../lib/form-data";

/** 템플릿 선택지 (서버 FORM_TEMPLATES 키와 같다) */
const TEMPLATES = [
	{
		value: "blank",
		label: "빈 폼",
		description: "이름·전화번호만 있는 시작점",
	},
	{
		value: "retreat2026",
		label: "수련회 신청서 예시",
		description: "조건 분기, 회비, 문자 알림이 들어 있는 완성본",
	},
] as const;
type Template = (typeof TEMPLATES)[number]["value"];

/** 라디오 값은 느슨한 타입으로 온다. 선택지에 있는 값만 템플릿으로 인정한다 */
function isTemplate(value: unknown): value is Template {
	return TEMPLATES.some((template) => template.value === value);
}

const SLUG_PATTERN = "[a-z0-9][a-z0-9-]{1,60}";

function TemplatePicker({
	value,
	onChange,
}: {
	value: Template;
	onChange: (value: Template) => void;
}) {
	const groupId = useId();
	return (
		<RadioGroup
			aria-label="템플릿"
			className="grid gap-2 sm:grid-cols-2"
			onValueChange={(next) => {
				if (isTemplate(next)) {
					onChange(next);
				}
			}}
			value={value}
		>
			{TEMPLATES.map((template) => {
				const id = `${groupId}-${template.value}`;
				return (
					<Label
						className="has-data-checked:border-brand has-data-checked:bg-brand-soft flex cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal transition-colors"
						htmlFor={id}
						key={template.value}
					>
						<RadioGroupItem className="mt-0.5" id={id} value={template.value} />
						<span className="space-y-0.5">
							<span className="block text-sm font-medium">
								{template.label}
							</span>
							<span className="text-muted-foreground block text-xs leading-relaxed">
								{template.description}
							</span>
						</span>
					</Label>
				);
			})}
		</RadioGroup>
	);
}

function SlugField() {
	return (
		<div className="space-y-1.5">
			<Label htmlFor="new-form-slug">주소</Label>
			<div className="bg-background focus-within:ring-ring flex items-center rounded-md border focus-within:ring-2">
				<span className="text-muted-foreground pl-3 font-mono text-sm">
					/f/
				</span>
				<Input
					aria-describedby="new-form-slug-hint"
					className="border-0 pl-1 font-mono focus-visible:ring-0 focus-visible:ring-offset-0"
					id="new-form-slug"
					name="slug"
					pattern={SLUG_PATTERN}
					placeholder="retreat-2026-summer"
					required
				/>
			</div>
			<p className="text-muted-foreground text-xs" id="new-form-slug-hint">
				영문 소문자·숫자·하이픈, 2~61자. 만든 뒤에는 바꿀 수 없습니다.
			</p>
		</div>
	);
}

/** 제출 → 생성 → 편집 화면 이동. 실패 메시지는 값으로 받는다 */
function useCreateForm(template: Template) {
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);
	const submit = async (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		const data = new FormData(event.currentTarget);
		setPending(true);
		const result = await createFormFn({
			data: {
				slug: formText(data, "slug"),
				title: formText(data, "title"),
				template,
			},
		});
		setPending(false);
		if (!result.ok) {
			setError(result.message);
			return;
		}
		await navigate({
			to: "/admin/forms/$formId",
			params: { formId: result.data },
		});
	};
	return { error, pending, submit, clearError: () => setError(null) };
}

/** "새 폼" 버튼 + 생성 대화상자. 만들면 바로 편집 화면으로 이동 */
export function CreateFormDialog() {
	const [template, setTemplate] = useState<Template>("blank");
	const { error, pending, submit, clearError } = useCreateForm(template);
	return (
		<Dialog onOpenChange={clearError}>
			<DialogTrigger render={<Button />}>
				<Plus aria-hidden className="h-4 w-4" />새 폼
			</DialogTrigger>
			<DialogContent className="sm:max-w-lg">
				<form className="space-y-5" onSubmit={submit}>
					<DialogHeader>
						<DialogTitle>새 폼 만들기</DialogTitle>
						<DialogDescription>
							제목과 주소를 정하고 시작할 템플릿을 고르세요.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-1.5">
						<Label htmlFor="new-form-title">제목</Label>
						<Input
							id="new-form-title"
							maxLength={100}
							name="title"
							placeholder="2026 여름 수련회 신청"
							required
						/>
					</div>
					<SlugField />
					<TemplatePicker onChange={setTemplate} value={template} />
					{error && (
						<p className="text-destructive text-sm" role="alert">
							{error}
						</p>
					)}
					<DialogFooter>
						<Button disabled={pending} type="submit">
							{pending && (
								<Loader2 aria-hidden className="h-4 w-4 animate-spin" />
							)}
							만들고 편집하기
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
