"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ClubFormSchema } from "@jwc/schema";
import { Form } from "@jwc/ui";
import type React from "react";
import { FormProvider, useForm } from "react-hook-form";
import type { z } from "zod";

const schema = ClubFormSchema;

export type FormFieldSchema = z.infer<typeof schema>;

// =============================================================================
// 🎯 ClubFormProvider (React Hook Form 기반)
// =============================================================================

interface ClubFormProviderProps {
	children: React.ReactNode;
	defaultValues?: Partial<FormFieldSchema>;
}

export function ClubFormProvider({
	children,
	defaultValues = {},
}: ClubFormProviderProps) {
	// 안전한 기본값 설정으로 controlled input 보장
	const safeDefaultValues: Partial<FormFieldSchema> = {
		name: "",
		phone: "",
		department: undefined, // enum 타입이므로 undefined로 시작
		ageGroup: "",
		data: {},
		...defaultValues,
	};

	const methods = useForm<FormFieldSchema>({
		resolver: zodResolver(schema),
		defaultValues: safeDefaultValues,
		mode: "onSubmit",
		reValidateMode: "onSubmit",
		criteriaMode: "firstError",
	});

	return (
		<FormProvider {...methods}>
			<Form {...methods}>{children}</Form>
		</FormProvider>
	);
}

// =============================================================================
// 🔄 Backwards Compatibility (기존 컴포넌트)
// =============================================================================

interface LegacyProps {
	children: React.ReactNode;
}

export default function ClubFormContext({ children }: LegacyProps) {
	return <ClubFormProvider>{children}</ClubFormProvider>;
}
