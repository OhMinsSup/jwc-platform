"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormSchema } from "@jwc/schema";
import { Form } from "@jwc/ui";
import type React from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { useStepAtomValue } from "~/atoms/stepAtom";

const schema = FormSchema.pick({
	gender: true,
});

export type FormFieldSchema = z.infer<typeof schema>;

interface Props {
	children: React.ReactNode;
}

export default function FormGenderContext({ children }: Props) {
	const { step, stepMap } = useStepAtomValue();

	const initialData = stepMap.get(step) as FormFieldSchema | undefined;

	const form = useForm<FormFieldSchema>({
		resolver: zodResolver(schema),
		defaultValues: {
			gender: initialData?.gender ?? "남성",
		},
		reValidateMode: "onSubmit",
		criteriaMode: "firstError",
	});

	return <Form {...form}>{children}</Form>;
}
