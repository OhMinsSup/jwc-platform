import { validatePage } from "@jwc/form-core/answers/validate";
import type { Answers } from "@jwc/form-core/answers/value";
import type {
	FormDefinition,
	PageDef,
} from "@jwc/form-core/definition/definition";
import {
	nextStep,
	previousPageId,
	visibleFieldsOfPage,
} from "@jwc/form-core/logic/visibility";
import type { PageStep } from "@jwc/form-core/logic/visibility";
import { Button } from "@jwc/ui/components/button";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";

import { FieldView } from "./field-view";
import { useHumanCheck } from "./human-check";
import { ReviewView } from "./review-view";
import { useDraft, useDraftStore } from "./store";
import { useSubmit } from "./use-submit";

interface FormRunnerProps {
	definition: FormDefinition;
	onStepChange: (step: PageStep) => void;
	/** 미리보기: 제출 버튼 비활성 */
	preview?: boolean;
	slug: string;
	step: PageStep;
}

/** 단계가 가리키는 페이지. 정의에 없는 페이지면 첫 페이지 */
function pageOf(definition: FormDefinition, pageId: string) {
	return definition.pages.find((p) => p.id === pageId) ?? definition.pages[0];
}

/** 정의(데이터) 하나로 어떤 폼이든 렌더링한다. 상태는 answers 하나뿐, 나머지는 모두 파생. */
export function FormRunner({
	slug,
	definition,
	step,
	onStepChange,
	preview = false,
}: FormRunnerProps) {
	const answers = useDraft(slug);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const submit = useSubmit(slug, definition, (failedStep, fieldErrors) => {
		setErrors(fieldErrors);
		onStepChange(failedStep);
	});

	const goBack = () => {
		const previous = previousPageId(definition, answers, step);
		if (previous) {
			onStepChange({ kind: "page", pageId: previous });
		}
	};

	if (step.kind === "review") {
		return (
			<ReviewStep
				answers={answers}
				definition={definition}
				onBack={goBack}
				onEdit={(pageId) => onStepChange({ kind: "page", pageId })}
				preview={preview}
				submit={submit}
			/>
		);
	}

	const page = pageOf(definition, step.pageId);
	if (!page) {
		return null;
	}

	return (
		<PageForm
			answers={answers}
			definition={definition}
			errors={errors}
			onBack={previousPageId(definition, answers, step) ? goBack : undefined}
			onErrors={setErrors}
			onStepChange={onStepChange}
			page={page}
			slug={slug}
		/>
	);
}

interface ReviewStepProps {
	answers: Answers;
	definition: FormDefinition;
	onBack: () => void;
	onEdit: (pageId: string) => void;
	preview: boolean;
	submit: ReturnType<typeof useSubmit>;
}

/** 확인 단계: 답변 요약 + 제출 */
function ReviewStep({
	answers,
	definition,
	onBack,
	onEdit,
	preview,
	submit,
}: ReviewStepProps) {
	const human = useHumanCheck(!preview);
	const onSubmit = async () => {
		await submit.run(answers, human.token);
		// 토큰은 1회용: 실패해서 이 화면에 남으면 새 토큰을 받는다
		human.reset();
	};
	return (
		<div className="space-y-6">
			<StepHeader
				description="입력한 내용을 확인하고 제출해주세요."
				title="신청 내용 확인"
			/>
			<ReviewView answers={answers} definition={definition} onEdit={onEdit} />
			{human.widget}
			{submit.error && (
				<p className="border-destructive/30 bg-destructive/5 text-destructive rounded-xl border p-4 text-sm">
					{submit.error}
				</p>
			)}
			<NavButtons onBack={onBack}>
				<Button
					className="h-12 flex-1"
					disabled={preview || submit.pending || !human.ready}
					onClick={onSubmit}
				>
					{submit.pending ? (
						<Loader2 className="h-5 w-5 animate-spin" />
					) : (
						<CheckCircle2 className="mr-2 h-5 w-5" />
					)}
					{preview ? "미리보기에서는 제출할 수 없습니다" : "제출하기"}
				</Button>
			</NavButtons>
		</div>
	);
}

interface PageFormProps {
	answers: Answers;
	definition: FormDefinition;
	errors: Record<string, string>;
	/** 이전 페이지가 없으면 undefined (버튼 숨김) */
	onBack: (() => void) | undefined;
	onErrors: (errors: Record<string, string>) => void;
	onStepChange: (step: PageStep) => void;
	page: PageDef;
	slug: string;
}

/** 입력 페이지 하나. 제출(엔터 포함) = 검증(오류 표시) 후 다음 단계 */
function PageForm({
	answers,
	definition,
	errors,
	onBack,
	onErrors,
	onStepChange,
	page,
	slug,
}: PageFormProps) {
	const setAnswer = useDraftStore((state) => state.setAnswer);
	const fields = visibleFieldsOfPage(definition, page, answers);
	const goNext = () => {
		const result = validatePage(definition, answers, page.id);
		onErrors(result.ok ? {} : result.errors);
		if (result.ok) {
			onStepChange(nextStep(definition, answers, page.id));
		}
	};
	return (
		<form
			className="space-y-8"
			onSubmit={(event) => {
				event.preventDefault();
				goNext();
			}}
		>
			<StepHeader description={page.description} title={page.title} />
			{fields.map((field) => (
				<FieldView
					error={errors[field.id]}
					field={field}
					key={field.id}
					onChange={(value) => setAnswer(slug, field.id, value)}
					value={answers[field.id]}
				/>
			))}
			<NavButtons onBack={onBack}>
				<Button className="h-12 flex-1" type="submit">
					다음
					<ArrowRight className="ml-2 h-4 w-4" />
				</Button>
			</NavButtons>
		</form>
	);
}

function StepHeader({
	title,
	description,
}: {
	title: string;
	description?: string;
}) {
	return (
		<header className="space-y-1">
			<h1 className="text-2xl font-bold">{title}</h1>
			{description && <p className="text-muted-foreground">{description}</p>}
		</header>
	);
}

function NavButtons({
	onBack,
	children,
}: {
	onBack?: () => void;
	children: React.ReactNode;
}) {
	return (
		<div className="flex gap-3 pt-2">
			{onBack && (
				<Button
					className="h-12"
					onClick={onBack}
					type="button"
					variant="outline"
				>
					<ArrowLeft className="mr-2 h-4 w-4" />
					이전
				</Button>
			)}
			{children}
		</div>
	);
}
