import { Separator } from "@jwc/ui";
import React, { useCallback } from "react";
import type { Component as ClubComponent } from "~/types/club";
import { RadioQuestionField } from "./RadioQuestionField";
import { SelectQuestionField } from "./SelectQuestionField";
import { TextareaQuestionField } from "./TextareaQuestionField";

interface DynamicQuestionsProps {
	components: ClubComponent[];
}

/**
 * 동적 질문 렌더링 컴포넌트
 */
export const DynamicQuestions = React.memo<DynamicQuestionsProps>(
	({ components }) => {
		// 동적 컴포넌트 렌더링
		const renderDynamicComponents = useCallback(() => {
			if (components.length === 0) return null;

			return (
				<>
					<Separator />
					<div className="space-y-6">
						<h3 className="font-semibold text-lg">동아리별 질문</h3>
						{components.map((component: ClubComponent, index: number) => {
							const fieldName = `component_${component.id}`;

							return (
								<div key={component.id}>
									{component.type === "select" ? (
										<SelectQuestionField
											component={component}
											fieldName={fieldName}
										/>
									) : component.type === "radio" ? (
										<RadioQuestionField
											component={component}
											fieldName={fieldName}
										/>
									) : component.type === "description" ? (
										<TextareaQuestionField
											component={component}
											fieldName={fieldName}
										/>
									) : null}
									{index < components.length - 1 && (
										<Separator className="mt-6" />
									)}
								</div>
							);
						})}
					</div>
				</>
			);
		}, [components]);

		return renderDynamicComponents();
	}
);

DynamicQuestions.displayName = "DynamicQuestions";
