"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, Separator } from "@jwc/ui";
import React from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import {
	BasicInfoFields,
	ClubInfoHeader,
	DynamicQuestions,
	FormActionButtons,
	FormHeader,
} from "./components";
import { ERROR_MESSAGES } from "./constants";
import { useClubData, useClubFormSubmission, useDynamicSchema } from "./hooks";
import type { ClubFormData, ClubSelectionProps } from "./types";

/**
 * ClubSelection 내부 컴포넌트 (표준 React Hook Form 사용)
 */
function ClubSelectionContent({ id }: { id: string | number }) {
	const methods = useFormContext<ClubFormData>();

	// 커스텀 훅들 사용
	const { club, components, clubDescription } = useClubData(id);
	const { onSubmit, handleGoBack, isSubmitting } = useClubFormSubmission(id);

	// 로딩 상태 처리
	if (!club) {
		return (
			<div className="container mx-auto mt-10 max-w-4xl px-4 py-8">
				<Card className="shadow-lg">
					<CardContent className="p-8 text-center">
						<p className="text-muted-foreground">
							{ERROR_MESSAGES.clubNotFound}
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto mt-10 max-w-4xl px-4 py-8">
			{/* 동아리 정보 헤더 */}
			<ClubInfoHeader club={club} clubDescription={clubDescription} />

			{/* 신청 폼 */}
			<Card className="shadow-lg">
				<FormHeader />
				<CardContent className="px-8 py-4">
					<form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8">
						{/* 기본 필드들 */}
						<BasicInfoFields />

						{/* 동적 컴포넌트 필드들 */}
						<DynamicQuestions components={components} />

						<Separator className="my-8" />

						{/* 액션 버튼들 */}
						<FormActionButtons
							isSubmitting={isSubmitting}
							onGoBack={handleGoBack}
						/>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

/**
 * 메인 ClubSelection 컴포넌트
 */
export default function ClubSelection({ id }: ClubSelectionProps) {
	// 클럽 데이터와 동적 스키마 생성
	const { components } = useClubData(id);
	const dynamicSchema = useDynamicSchema(components);

	// React Hook Form 설정
	const methods = useForm<ClubFormData>({
		resolver: zodResolver(dynamicSchema),
		defaultValues: {
			clubId: typeof id === "string" ? Number.parseInt(id, 10) : id,
			name: "",
			phone: "",
			department: "청년1부",
			ageGroup: "",
			data: {},
		},
	});

	return (
		<FormProvider {...methods}>
			<ClubSelectionContent id={id} />
		</FormProvider>
	);
}
