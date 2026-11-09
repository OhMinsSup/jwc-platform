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
import { Callout } from "@jwc/ui-patterns/components/callout";
import { Button } from "@jwc/ui/components/button";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";

import { DraftField } from "./field-view";
import { useHumanCheck } from "./human-check";
import { ReviewView } from "./review-view";
import { useDraft } from "./store";
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
			preview={preview}
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
				preview={preview}
				title="신청 내용 확인"
			/>
			<ReviewView answers={answers} definition={definition} onEdit={onEdit} />
			{human.widget}
			{submit.error && (
				<Callout role="alert" tone="danger">
					{submit.error}
				</Callout>
			)}
			<NavButtons onBack={onBack}>
				<Button
					className="h-12 flex-1 rounded-full text-[15px] font-semibold"
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
	/** 미리보기: 관리자 화면 안에 들어가므로 제목을 h2로 (h1은 관리자 화면 것 하나) */
	preview: boolean;
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
	preview,
	slug,
}: PageFormProps) {
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
			<StepHeader
				description={page.description}
				preview={preview}
				title={page.title}
			/>
			{fields.map((field) => (
				<DraftField
					error={errors[field.id]}
					field={field}
					key={field.id}
					slug={slug}
				/>
			))}
			<NavButtons onBack={onBack}>
				<NextButton />
			</NavButtons>
		</form>
	);
}

/** 입력 페이지의 주 버튼 (폼 제출 = 검증 후 다음 단계) */
function NextButton() {
	return (
		<Button
			className="h-12 flex-1 rounded-full text-[15px] font-semibold"
			type="submit"
		>
			다음
			<ArrowRight className="ml-2 h-4 w-4" />
		</Button>
	);
}

function StepHeader({
	title,
	description,
	preview,
}: {
	title: string;
	description?: string;
	preview: boolean;
}) {
	const Heading = preview ? "h2" : "h1";
	return (
		<header className="space-y-2">
			<Heading className="font-display text-[26px] leading-tight font-bold tracking-[-0.03em] sm:text-[30px]">
				{title}
			</Heading>
			{description && (
				<p className="text-muted-foreground leading-relaxed">{description}</p>
			)}
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
					className="h-12 rounded-full px-5 text-[15px]"
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
