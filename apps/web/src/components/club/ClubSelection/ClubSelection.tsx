"use client";

import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	RadioGroup,
	RadioGroupItem,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Separator,
	Textarea,
} from "@jwc/ui";
import { onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import React, { useCallback, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { upsertClubForm } from "~/api/actions/clubForms";
import {
	ClubFormProvider,
	type FormFieldSchema,
} from "~/components/forms/FormContext/ClubFormContext";
import { useORPC } from "~/libs/orpc/react";
import type { Component as ClubComponent, ComponentData } from "~/types/club";

interface ClubSelectionProps {
	id: string | number;
}

// 상수 정의
const DEPARTMENT_OPTIONS = [
	{ value: "청년1부", label: "청년 1부" },
	{ value: "청년2부", label: "청년 2부" },
	{ value: "기타", label: "기타" },
] as const;

const FORM_PLACEHOLDERS = {
	name: "이름을 입력해주세요",
	phone: "연락처를 입력해주세요",
	department: "부서를 선택해주세요",
	ageGroup: "또래를 입력해주세요 (예: 93또래)",
	component: "선택해주세요",
	description: "내용을 입력해주세요...",
} as const;

const ERROR_MESSAGES = {
	name: "이름을 입력해주세요",
	phone: "연락처를 입력해주세요",
	department: "부서를 선택해주세요",
	ageGroup: "또래를 입력해주세요",
	submit: "신청 제출에 실패했습니다.",
	clubNotFound: "동아리 정보를 불러올 수 없습니다.",
} as const;

const SUCCESS_MESSAGE = "신청이 성공적으로 제출되었습니다." as const;

// Rich Text 내용을 일반 텍스트로 변환하는 함수 (최적화)
const extractTextFromRichText = (content: unknown): string => {
	if (!content || typeof content !== "object") return "";

	const contentObj = content as { root?: { children?: unknown[] } };
	if (!contentObj.root?.children?.length) return "";

	const extractText = (node: unknown): string => {
		if (!node || typeof node !== "object") return "";

		const nodeObj = node as {
			type?: string;
			text?: string;
			children?: unknown[];
		};

		switch (nodeObj.type) {
			case "text":
				return nodeObj.text || "";
			case "linebreak":
				return "\n";
			default:
				return nodeObj.children?.map(extractText).join("") || "";
		}
	};

	return contentObj.root.children.map(extractText).join("\n").trim();
};

// =============================================================================
// 📋 폼 필드 컴포넌트들
// =============================================================================

// 기본 정보 입력 필드 컴포넌트
const BasicInfoFields = React.memo(() => {
	const { control } = useFormContext<FormFieldSchema>();

	return (
		<div className="space-y-6">
			<h3 className="font-semibold text-lg">신청자 정보</h3>
			<div className="grid gap-4 md:grid-cols-2">
				<FormField
					control={control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="font-semibold">
								이름 <span className="text-red-500">*</span>
							</FormLabel>
							<FormControl>
								<Input placeholder={FORM_PLACEHOLDERS.name} {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={control}
					name="phone"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="font-semibold">
								연락처 <span className="text-red-500">*</span>
							</FormLabel>
							<FormControl>
								<Input
									placeholder={FORM_PLACEHOLDERS.phone}
									type="tel"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<FormField
					control={control}
					name="department"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="font-semibold">
								부서 <span className="text-red-500">*</span>
							</FormLabel>{" "}
							<Select
								onValueChange={field.onChange}
								value={String(field.value || "")}
							>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder={FORM_PLACEHOLDERS.department} />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{DEPARTMENT_OPTIONS.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={control}
					name="ageGroup"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="font-semibold">
								또래 <span className="text-red-500">*</span>
							</FormLabel>
							<FormControl>
								<Input placeholder={FORM_PLACEHOLDERS.ageGroup} {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
		</div>
	);
});

// 선택형 질문 필드 컴포넌트
const SelectQuestionField = React.memo(
	({
		component,
		fieldName,
	}: {
		component: ClubComponent;
		fieldName: string;
	}) => {
		const { control } = useFormContext<FormFieldSchema>();
		const dataFieldName = `data.${fieldName}` as const;

		return (
			<FormField
				control={control}
				name={dataFieldName}
				render={({ field }) => (
					<FormItem className="space-y-3">
						<FormLabel className="font-semibold text-base">
							{component.title}
							{component.data?.required && (
								<span className="ml-1 text-red-500">*</span>
							)}
						</FormLabel>
						{component.description && (
							<FormDescription>{component.description}</FormDescription>
						)}
						<Select
							onValueChange={field.onChange}
							value={String(field.value || "")}
						>
							<FormControl>
								<SelectTrigger className="w-full">
									<SelectValue placeholder={FORM_PLACEHOLDERS.component} />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								{component.data?.data?.map(
									(option: ComponentData, optionIndex: number) => (
										<SelectItem
											key={`select-${component.id}-${option.id || optionIndex}`}
											value={option.name}
										>
											{option.name}
										</SelectItem>
									)
								)}
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>
		);
	}
);

// 서술형 질문 필드 컴포넌트
const TextareaQuestionField = React.memo(
	({
		component,
		fieldName,
	}: {
		component: ClubComponent;
		fieldName: string;
	}) => {
		const { control } = useFormContext<FormFieldSchema>();
		const dataFieldName = `data.${fieldName}` as const;

		return (
			<FormField
				control={control}
				name={dataFieldName}
				render={({ field }) => (
					<FormItem className="space-y-3">
						<FormLabel className="font-semibold text-base">
							{component.title}
							{component.data?.required && (
								<span className="ml-1 text-red-500">*</span>
							)}
						</FormLabel>
						{component.description && (
							<FormDescription>{component.description}</FormDescription>
						)}
						<FormControl>
							<Textarea
								placeholder={FORM_PLACEHOLDERS.description}
								className="min-h-[120px] resize-none"
								{...field}
								value={String(field.value || "")}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		);
	}
);

// 라디오 버튼 질문 필드 컴포넌트
const RadioQuestionField = React.memo(
	({
		component,
		fieldName,
	}: {
		component: ClubComponent;
		fieldName: string;
	}) => {
		const { control } = useFormContext<FormFieldSchema>();
		const dataFieldName = `data.${fieldName}` as const;

		return (
			<FormField
				control={control}
				name={dataFieldName}
				render={({ field }) => (
					<FormItem className="space-y-3">
						<FormLabel className="font-semibold text-base">
							{component.title}
							{component.data?.required && (
								<span className="ml-1 text-red-500">*</span>
							)}
						</FormLabel>
						{component.description && (
							<FormDescription>{component.description}</FormDescription>
						)}
						<FormControl>
							<RadioGroup
								onValueChange={field.onChange}
								value={String(field.value || "")}
								className="flex flex-col space-y-2"
							>
								{component.data?.data?.map(
									(option: ComponentData, optionIndex: number) => (
										<div
											key={`radio-${component.id}-${option.id || optionIndex}`}
											className="flex items-center space-x-3"
										>
											<RadioGroupItem
												value={option.name}
												id={`${component.id}-${option.id || optionIndex}`}
											/>
											<label
												htmlFor={`${component.id}-${option.id || optionIndex}`}
												className="cursor-pointer font-normal text-sm"
											>
												{option.name}
											</label>
										</div>
									)
								)}
							</RadioGroup>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		);
	}
);

// DisplayName 설정
BasicInfoFields.displayName = "BasicInfoFields";
SelectQuestionField.displayName = "SelectQuestionField";
TextareaQuestionField.displayName = "TextareaQuestionField";
RadioQuestionField.displayName = "RadioQuestionField";

// =============================================================================
// 🎯 UI 컴포넌트들
// =============================================================================

// 클럽 정보 헤더 컴포넌트
const ClubInfoHeader = React.memo(
	({
		club,
		clubDescription,
	}: {
		club: { title: string };
		clubDescription: string;
	}) => (
		<Card className="mb-8 shadow-lg">
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-3">
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
							<svg
								className="h-6 w-6 text-primary"
								fill="currentColor"
								viewBox="0 0 24 24"
							>
								<title>동아리 아이콘</title>
								<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
							</svg>
						</div>
						<div>
							<CardTitle className="text-2xl">{club.title}</CardTitle>
						</div>
					</div>
				</div>
			</CardHeader>
			{clubDescription && (
				<CardContent className="pt-0">
					<div className="rounded-lg bg-muted/50 p-4">
						<h3 className="mb-3 font-semibold text-base">동아리 소개</h3>
						<div className="whitespace-pre-line text-muted-foreground text-sm leading-relaxed">
							{clubDescription}
						</div>
					</div>
				</CardContent>
			)}
		</Card>
	)
);

// 폼 헤더 컴포넌트
const FormHeader = React.memo(() => (
	<CardHeader>
		<div className="flex items-center space-x-3">
			<div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
				<svg
					className="h-4 w-4 text-blue-600"
					fill="currentColor"
					viewBox="0 0 24 24"
				>
					<title>폼 아이콘</title>
					<path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
				</svg>
			</div>
			<CardTitle className="text-xl">신청서 작성</CardTitle>
		</div>
		<Separator />
	</CardHeader>
));

// 폼 액션 버튼들 컴포넌트
const FormActionButtons = React.memo(
	({
		isSubmitting,
		onGoBack,
	}: {
		isSubmitting: boolean;
		onGoBack: () => void;
	}) => (
		<div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
			<Button
				type="button"
				variant="outline"
				onClick={onGoBack}
				className="flex items-center gap-2"
			>
				<svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
					<title>뒤로가기</title>
					<path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" />
				</svg>
				이전으로
			</Button>

			<Button
				type="submit"
				disabled={isSubmitting}
				className="flex items-center gap-2"
			>
				{isSubmitting ? (
					<>
						<div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
						제출 중...
					</>
				) : (
					<>
						<svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
							<title>제출</title>
							<path d="M2,21L23,12L2,3V10L17,12L2,14V21Z" />
						</svg>
						신청 완료
					</>
				)}
			</Button>
		</div>
	)
);

// DisplayName 설정
ClubInfoHeader.displayName = "ClubInfoHeader";
FormHeader.displayName = "FormHeader";
FormActionButtons.displayName = "FormActionButtons";

// =============================================================================
// 🔧 커스텀 훅들
// =============================================================================

// 클럽 데이터를 가져오는 훅
const useClubData = (id: string | number) => {
	const orpc = useORPC();

	const { data: clubResponse } = useSuspenseQuery(
		orpc.clubs.getById.queryOptions({ input: { id } })
	);

	const club = useMemo(() => clubResponse?.data, [clubResponse?.data]);
	const components = useMemo(() => club?.components || [], [club?.components]);
	const clubDescription = useMemo(
		() => extractTextFromRichText(club?.content),
		[club?.content]
	);

	return { club, components, clubDescription };
};

// =============================================================================
// 🎯 메인 컴포넌트 (Context 기반)
// =============================================================================

// ClubSelection 내부 컴포넌트 (표준 React Hook Form 사용)
function ClubSelectionContent({ id }: { id: string | number }) {
	const router = useRouter();
	const methods = useFormContext<FormFieldSchema>();

	// 커스텀 훅들 사용
	const { club, components, clubDescription } = useClubData(id);

	// 서버 액션 설정
	const { execute, status } = useServerAction(upsertClubForm, {
		interceptors: [
			onSuccess((ctx) => {
				if (ctx.success) {
					router.push(`/form/club/${id}/success`);
				}
			}),
		],
	});

	// 폼 제출 핸들러
	const onSubmit = useCallback(
		async (data: FormFieldSchema) => {
			try {
				// data.data에서 component_ 필드들 추출
				const componentData = Object.fromEntries(
					Object.entries(data.data || {}).filter(([key]) =>
						key.startsWith("component_")
					)
				);

				const clubFormData = {
					clubId: id.toString(),
					name: data.name || "",
					phone: data.phone || "",
					department: data.department || "",
					ageGroup: data.ageGroup || "",
					data: componentData,
				};

				// 서버 액션 실행
				await execute(clubFormData);
			} catch (error) {
				console.error("동아리 신청 제출 실패:", error);
				const errorMessage =
					error instanceof Error ? error.message : ERROR_MESSAGES.submit;
				alert(errorMessage);
			}
		},
		[id, execute]
	);

	// 뒤로가기 핸들러
	const handleGoBack = useCallback(() => {
		router.back();
	}, [router]);

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
				<CardContent className="p-8">
					<form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8">
						{/* 기본 필드들 */}
						<BasicInfoFields />

						{/* 동적 컴포넌트 필드들 */}
						{renderDynamicComponents()}

						<Separator className="my-8" />

						{/* 액션 버튼들 */}
						<FormActionButtons
							isSubmitting={status === "pending"}
							onGoBack={handleGoBack}
						/>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

export default function ClubSelection({ id }: ClubSelectionProps) {
	return (
		<ClubFormProvider
			defaultValues={{
				// @ts-expect-error clubId is a string or number
				clubId: id,
			}}
		>
			<ClubSelectionContent id={id} />
		</ClubFormProvider>
	);
}
