"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import {
	TSHIRT_SIZE_LABELS,
	type TshirtSize,
	TshirtSizeEnum,
} from "@jwc/schema";
import {
	Button,
	cn,
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@jwc/ui";
import { useNavigate } from "@tanstack/react-router";
import type { Variants } from "framer-motion";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Ruler, Shirt } from "lucide-react";
import { useEffect, useRef, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { useOnboardingFormStore } from "@/store/onboarding-form-store";

const formVariants: Variants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { staggerChildren: 0.08, delayChildren: 0.1 },
	},
};

const itemVariants: Variants = {
	hidden: { opacity: 0, y: 16 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.4, ease: "easeOut" as const },
	},
};

const additionalSchema = z.object({
	tshirtSize: TshirtSizeEnum,
});

type AdditionalFormData = z.infer<typeof additionalSchema>;

const TSHIRT_SIZE_OPTIONS: {
	value: TshirtSize;
	label: string;
	chest: string;
}[] = [
	{ value: "s", label: TSHIRT_SIZE_LABELS.s, chest: "90cm" },
	{ value: "m", label: TSHIRT_SIZE_LABELS.m, chest: "95cm" },
	{ value: "l", label: TSHIRT_SIZE_LABELS.l, chest: "100cm" },
	{ value: "xl", label: TSHIRT_SIZE_LABELS.xl, chest: "105cm" },
	{ value: "2xl", label: TSHIRT_SIZE_LABELS["2xl"], chest: "110cm" },
	{ value: "3xl", label: TSHIRT_SIZE_LABELS["3xl"], chest: "115cm" },
];

export function AdditionalInfoStep() {
	const navigate = useNavigate();
	const { additionalInfo, setAdditionalInfo, setCurrentStep } =
		useOnboardingFormStore();
	const formRef = useRef<HTMLFormElement>(null);
	const [isPending, startTransition] = useTransition();

	const form = useForm<AdditionalFormData>({
		resolver: standardSchemaResolver(additionalSchema),
		defaultValues: {
			tshirtSize: additionalInfo?.tshirtSize ?? undefined,
		},
		mode: "onChange",
	});

	// Store 값이 변경되면 폼 값도 업데이트
	useEffect(() => {
		if (additionalInfo) {
			form.reset({
				tshirtSize: additionalInfo.tshirtSize ?? undefined,
			});
		}
	}, [additionalInfo, form]);

	const onSubmit = (data: AdditionalFormData) => {
		startTransition(async () => {
			setAdditionalInfo(data);
			setCurrentStep("confirm");
			await navigate({
				to: "/onboarding/$step",
				params: { step: "confirm" },
			});
		});
	};

	const handleBack = () => {
		startTransition(async () => {
			setCurrentStep("support");
			await navigate({ to: "/onboarding/$step", params: { step: "support" } });
		});
	};

	return (
		<div className="mx-auto w-full max-w-xl">
			{/* 헤더 */}
			<motion.div
				animate={{ opacity: 1, y: 0 }}
				className="mb-10"
				initial={{ opacity: 0, y: -10 }}
				transition={{ duration: 0.5 }}
			>
				<div className="mb-3 flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
						<Shirt className="h-5 w-5 text-primary" />
					</div>
					<span className="font-medium text-primary text-sm">Step 4 of 5</span>
				</div>
				<h1 className="mb-2 font-bold text-2xl text-foreground md:text-3xl">
					티셔츠 사이즈 선택
				</h1>
				<p className="text-muted-foreground">
					수련회에서 제공되는 단체 티셔츠 사이즈를 선택해주세요
				</p>
			</motion.div>

			<Form {...form}>
				<motion.form
					animate="visible"
					className="space-y-8"
					initial="hidden"
					onSubmit={form.handleSubmit(onSubmit)}
					ref={formRef}
					variants={formVariants}
				>
					{/* 티셔츠 사이즈 선택 */}
					<motion.div variants={itemVariants}>
						<FormField
							control={form.control}
							name="tshirtSize"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="mb-4 flex items-center gap-2 font-medium text-foreground text-sm">
										<Shirt className="h-4 w-4 text-muted-foreground" />
										사이즈 선택
									</FormLabel>
									<FormControl>
										<div className="grid grid-cols-3 gap-3">
											{TSHIRT_SIZE_OPTIONS.map((option) => (
												<button
													className={cn(
														"relative flex flex-col items-center justify-center rounded-xl border px-3 py-5 transition-all duration-200",
														"focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
														field.value === option.value
															? "border-primary bg-primary/10 shadow-md"
															: "border-border/50 bg-muted/30 hover:border-border hover:bg-muted/50"
													)}
													key={option.value}
													onClick={() => field.onChange(option.value)}
													type="button"
												>
													<span
														className={cn(
															"mb-1 font-bold text-lg",
															field.value === option.value
																? "text-primary"
																: "text-foreground"
														)}
													>
														{option.label}
													</span>
													<span className="text-muted-foreground text-xs">
														가슴둘레 {option.chest}
													</span>
													{field.value === option.value && (
														<motion.div
															animate={{ scale: 1 }}
															className="-top-2 -right-2 absolute flex h-5 w-5 items-center justify-center rounded-full bg-primary"
															initial={{ scale: 0 }}
														>
															<Check className="h-3 w-3 text-primary-foreground" />
														</motion.div>
													)}
												</button>
											))}
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</motion.div>

					{/* 사이즈 가이드 */}
					<motion.div variants={itemVariants}>
						<div className="rounded-xl border border-border/50 bg-muted/20 p-5">
							<div className="mb-3 flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background shadow-sm">
									<Ruler className="h-5 w-5 text-muted-foreground" />
								</div>
								<div className="font-medium text-foreground">사이즈 가이드</div>
							</div>
							<p className="text-muted-foreground text-sm leading-relaxed">
								티셔츠는 일반적인 오버핏 스타일입니다. 평소 입으시는 사이즈를
								선택하시거나, 조금 여유있게 입고 싶으시면 한 사이즈 큰 것을
								선택해주세요.
							</p>
						</div>
					</motion.div>

					{/* 버튼 영역 */}
					<motion.div className="flex gap-3 pt-4" variants={itemVariants}>
						<Button
							className="h-12 rounded-xl border-border/50 px-6 hover:bg-muted/50"
							onClick={handleBack}
							type="button"
							variant="outline"
						>
							<ArrowLeft className="mr-2 h-4 w-4" />
							이전
						</Button>
						<Button
							className="h-12 flex-1 rounded-xl bg-primary font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-200 hover:bg-primary/90"
							disabled={isPending || !form.formState.isValid}
							type="submit"
						>
							{isPending ? (
								<motion.div
									animate={{ rotate: 360 }}
									className="h-5 w-5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
									transition={{
										duration: 1,
										repeat: Number.POSITIVE_INFINITY,
										ease: "linear",
									}}
								/>
							) : (
								<>
									다음 단계
									<ArrowRight className="ml-2 h-4 w-4" />
								</>
							)}
						</Button>
					</motion.div>
				</motion.form>
			</Form>
		</div>
	);
}

export default AdditionalInfoStep;
