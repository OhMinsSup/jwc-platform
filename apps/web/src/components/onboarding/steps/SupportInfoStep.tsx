"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { TF_TEAM_LABELS, type TfTeam, TfTeamEnum } from "@jwc/schema";
import {
	Button,
	cn,
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Textarea,
} from "@jwc/ui";
import { useNavigate } from "@tanstack/react-router";
import type { Variants } from "framer-motion";
import { motion } from "framer-motion";
import {
	ArrowLeft,
	ArrowRight,
	Camera,
	Car,
	Check,
	Gamepad2,
	Heart,
	type LucideIcon,
	Music,
	Users,
} from "lucide-react";
import { useEffect, useRef } from "react";
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

const supportSchema = z.object({
	tfTeam: TfTeamEnum.optional(),
	canProvideRide: z.boolean().optional(),
	rideDetails: z.string().max(500).optional(),
});

type SupportFormData = z.infer<typeof supportSchema>;

const TF_TEAM_OPTIONS: {
	value: TfTeam;
	label: string;
	description: string;
	Icon: LucideIcon;
}[] = [
	{
		value: "none",
		label: TF_TEAM_LABELS.none,
		description: "TF팀에 참여하지 않습니다",
		Icon: Heart,
	},
	{
		value: "praise",
		label: TF_TEAM_LABELS.praise,
		description: "예배 찬양 인도 및 반주",
		Icon: Music,
	},
	{
		value: "program",
		label: TF_TEAM_LABELS.program,
		description: "레크레이션 및 친교 프로그램 진행",
		Icon: Gamepad2,
	},
	{
		value: "media",
		label: TF_TEAM_LABELS.media,
		description: "사진/영상 촬영 및 편집",
		Icon: Camera,
	},
];

export function SupportInfoStep() {
	const navigate = useNavigate();
	const {
		supportInfo,
		setSupportInfo,
		setCurrentStep,
		isLoading,
		setIsLoading,
	} = useOnboardingFormStore();
	const formRef = useRef<HTMLFormElement>(null);

	const form = useForm<SupportFormData>({
		resolver: standardSchemaResolver(supportSchema),
		defaultValues: {
			tfTeam: supportInfo?.tfTeam ?? "none",
			canProvideRide: supportInfo?.canProvideRide ?? false,
			rideDetails: supportInfo?.rideDetails ?? "",
		},
		mode: "onChange",
	});

	const canProvideRide = form.watch("canProvideRide");

	// Store 값이 변경되면 폼 값도 업데이트
	useEffect(() => {
		if (supportInfo) {
			form.reset({
				tfTeam: supportInfo.tfTeam ?? "none",
				canProvideRide: supportInfo.canProvideRide ?? false,
				rideDetails: supportInfo.rideDetails ?? "",
			});
		}
	}, [supportInfo, form]);

	const onSubmit = async (data: SupportFormData) => {
		setIsLoading(true);
		try {
			setSupportInfo(data);
			setCurrentStep("additional");
			await navigate({
				to: "/onboarding/$step",
				params: { step: "additional" },
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleBack = async () => {
		setCurrentStep("attendance");
		await navigate({ to: "/onboarding/$step", params: { step: "attendance" } });
	};

	return (
		<div className="mx-auto w-full max-w-xl px-4 py-8">
			{/* 헤더 */}
			<motion.div
				animate={{ opacity: 1, y: 0 }}
				className="mb-10"
				initial={{ opacity: 0, y: -10 }}
				transition={{ duration: 0.5 }}
			>
				<div className="mb-3 flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
						<Heart className="h-5 w-5 text-primary" />
					</div>
					<span className="font-medium text-primary text-sm">Step 3 of 5</span>
				</div>
				<h1 className="mb-2 font-bold text-2xl text-foreground md:text-3xl">
					지원
				</h1>
				<p className="text-muted-foreground">
					수련회 준비에 함께해 주실 부분이 있으시면 알려주세요
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
					{/* TF 팀 선택 */}
					<motion.div variants={itemVariants}>
						<FormField
							control={form.control}
							name="tfTeam"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="mb-4 flex items-center gap-2 font-medium text-foreground text-sm">
										<Users className="h-4 w-4 text-muted-foreground" />
										TF팀 참여 (선택)
									</FormLabel>
									<p className="mb-4 text-muted-foreground text-sm">
										수련회 준비에 참여하고 싶은 팀을 선택해주세요
									</p>
									<FormControl>
										<div className="grid gap-3">
											{TF_TEAM_OPTIONS.map((option) => (
												<motion.button
													className={cn(
														"relative flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200",
														"focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
														field.value === option.value
															? "border-primary bg-primary/5 shadow-md"
															: "border-border/50 bg-muted/30 hover:border-border hover:bg-muted/50"
													)}
													key={option.value}
													onClick={() => field.onChange(option.value)}
													type="button"
													whileHover={{ scale: 1.01 }}
													whileTap={{ scale: 0.99 }}
												>
													<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-background shadow-sm">
														<option.Icon className="h-6 w-6 text-muted-foreground" />
													</div>
													<div className="flex-1">
														<div className="font-medium text-foreground">
															{option.label}
														</div>
														<div className="text-muted-foreground text-sm">
															{option.description}
														</div>
													</div>
													{field.value === option.value && (
														<motion.div
															animate={{ scale: 1 }}
															className="absolute right-4 flex h-6 w-6 items-center justify-center rounded-full bg-primary"
															initial={{ scale: 0 }}
														>
															<Check className="h-4 w-4 text-primary-foreground" />
														</motion.div>
													)}
												</motion.button>
											))}
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</motion.div>

					{/* 차량 지원 */}
					<motion.div variants={itemVariants}>
						<div className="space-y-4 rounded-xl border border-border/50 bg-muted/20 p-5">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background shadow-sm">
									<Car className="h-5 w-5 text-primary" />
								</div>
								<div>
									<div className="font-medium text-foreground">차량 지원</div>
									<div className="text-muted-foreground text-sm">
										다른 참석자들의 이동을 도와주실 수 있나요?
									</div>
								</div>
							</div>

							<FormField
								control={form.control}
								name="canProvideRide"
								render={({ field }) => (
									<FormItem>
										<FormControl>
											<div className="flex gap-2">
												<button
													className={cn(
														"flex-1 rounded-xl border py-3 font-medium text-sm transition-all duration-200",
														field.value === true
															? "border-primary bg-primary text-primary-foreground"
															: "border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/50"
													)}
													onClick={() => field.onChange(true)}
													type="button"
												>
													가능합니다
												</button>
												<button
													className={cn(
														"flex-1 rounded-xl border py-3 font-medium text-sm transition-all duration-200",
														field.value === false
															? "border-primary bg-primary text-primary-foreground"
															: "border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/50"
													)}
													onClick={() => field.onChange(false)}
													type="button"
												>
													불가능합니다
												</button>
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{canProvideRide && (
								<motion.div
									animate={{ opacity: 1, height: "auto" }}
									exit={{ opacity: 0, height: 0 }}
									initial={{ opacity: 0, height: 0 }}
									transition={{ duration: 0.3 }}
								>
									<FormField
										control={form.control}
										name="rideDetails"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="font-medium text-foreground text-sm">
													차량 정보
												</FormLabel>
												<FormControl>
													<Textarea
														{...field}
														className="min-h-[100px] resize-none border-border/50 bg-background transition-all duration-200 focus:border-primary"
														placeholder="예: 7인승 차량, 4명 탑승 가능, 금요일 저녁 출발 가능"
													/>
												</FormControl>
												<p className="mt-2 text-muted-foreground text-xs">
													탑승 가능 인원, 출발 가능 시간 등을 알려주세요
												</p>
												<FormMessage />
											</FormItem>
										)}
									/>
								</motion.div>
							)}
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
							disabled={isLoading}
							type="submit"
						>
							{isLoading ? (
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

export default SupportInfoStep;
