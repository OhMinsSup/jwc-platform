import type { Answers } from "@jwc/form-core/answers/value";
import type {
	FormDefinition,
	PageDef,
} from "@jwc/form-core/definition/definition";
import { isDisplayOnly } from "@jwc/form-core/definition/fields";
import type { FieldDef } from "@jwc/form-core/definition/fields";
import { formatFieldValue } from "@jwc/form-core/field-types/values";
import { resolveVisibility } from "@jwc/form-core/logic/visibility";
import type { VisibilityState } from "@jwc/form-core/logic/visibility";
import { computeAmount } from "@jwc/form-core/messaging";
import { Button } from "@jwc/ui/components/button";
import { Pencil } from "lucide-react";

interface ReviewViewProps {
	answers: Answers;
	definition: FormDefinition;
	onEdit: (pageId: string) => void;
}

interface ReviewSectionProps {
	fields: ReadonlyMap<string, FieldDef>;
	onEdit: (pageId: string) => void;
	page: PageDef;
	visibility: VisibilityState;
	visibleFields: ReadonlySet<string>;
}

/** 페이지 하나의 답변 요약 + 그 페이지로 돌아가는 수정 버튼 */
function ReviewSection({
	page,
	fields,
	visibility,
	visibleFields,
	onEdit,
}: ReviewSectionProps) {
	return (
		<section className="overflow-hidden rounded-xl border">
			<header className="bg-muted/30 flex items-center justify-between border-b px-5 py-3">
				<h2 className="font-medium">{page.title}</h2>
				<Button onClick={() => onEdit(page.id)} size="sm" variant="ghost">
					<Pencil className="mr-1 h-3.5 w-3.5" />
					수정
				</Button>
			</header>
			<dl className="divide-y px-5">
				{page.fieldIds
					.map((id) => fields.get(id))
					.filter(
						(field) =>
							field && !isDisplayOnly(field) && visibleFields.has(field.id),
					)
					.map((field) => {
						if (!field) {
							return null;
						}
						const value = visibility.answers[field.id];
						return (
							<div
								className="flex justify-between gap-4 py-2.5 text-sm"
								key={field.id}
							>
								<dt className="text-muted-foreground">{field.label}</dt>
								<dd className="text-right font-medium whitespace-pre-line">
									{value === undefined ? "-" : formatFieldValue(field, value)}
								</dd>
							</div>
						);
					})}
			</dl>
		</section>
	);
}

/** 제출 전 확인 화면. 표시값은 시트/문자와 같은 formatFieldValue로 만든다 (표현 일관성). */
export function ReviewView({ definition, answers, onEdit }: ReviewViewProps) {
	const visibility = resolveVisibility(definition, answers);
	const visibleFields = new Set(visibility.fieldIds);
	const fields = new Map(definition.fields.map((field) => [field.id, field]));
	const amount = computeAmount(definition, visibility.answers);

	return (
		<div className="space-y-4">
			{definition.pages
				.filter((page) => visibility.pageIds.includes(page.id))
				.map((page) => (
					<ReviewSection
						fields={fields}
						key={page.id}
						onEdit={onEdit}
						page={page}
						visibility={visibility}
						visibleFields={visibleFields}
					/>
				))}
			{amount !== null && (
				<p className="bg-primary/5 rounded-xl border px-5 py-4 text-sm">
					납부 금액{" "}
					<strong className="ml-2 text-base">
						{amount.toLocaleString("ko-KR")}원
					</strong>
				</p>
			)}
		</div>
	);
}
